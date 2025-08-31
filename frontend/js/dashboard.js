/**
 * Dashboard JavaScript file for EvenUp
 * Handles group creation, modal management, and dynamic UI updates
 */

document.addEventListener('DOMContentLoaded', () => {
  // Add event listeners for dynamic group creation form
  const groupCategorySelect = document.getElementById('groupCategory');
  if (groupCategorySelect) {
      groupCategorySelect.addEventListener('change', handleCategoryChange);
  }

  const addMemberInput = document.getElementById('addMemberInput');
  if (addMemberInput) {
      addMemberInput.addEventListener('keydown', handleAddMember);
      addMemberInput.addEventListener('input', handleMemberSearchInput);
      addMemberInput.addEventListener('blur', () => setTimeout(clearMemberSuggestions, 150));
  }
  
  // Initial call to set up the group creation form
  handleCategoryChange();

  // Load user's groups on startup
  try { loadUserGroups(); } catch (_) {}

  // Add event listeners for expense summary updates
  setupExpenseSummaryListeners();
  
  // Initialize user avatar before setting up listeners
  initializeUserAvatar();
  
  // Add event listeners for the avatar and its dropdown
  setupAvatarDropdownListeners();
});

/**
 * Sets up event listeners for the user avatar dropdown menu.
 */
function setupAvatarDropdownListeners() {
    const avatarElement = document.getElementById('userAvatar');
    const dropdown = document.getElementById('avatarDropdown');
    
    if (avatarElement && dropdown) {
        avatarElement.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event from propagating to document
            dropdown.classList.toggle('active'); // Changed from 'is-active' to 'active'
        });

        // Close menu when clicking anywhere else
        document.addEventListener('click', (event) => {
            if (!avatarElement.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.remove('active'); // Changed from 'is-active' to 'active'
            }
        });
    }
}

/**
 * Sets up event listeners for dynamic expense summary updates
 */
function setupExpenseSummaryListeners() {
  // Update expense summary when amount changes
  const amountInput = document.getElementById('expenseAmount');
  if (amountInput) {
    amountInput.addEventListener('input', updateExpenseSummaryFromForm);
  }

  // Update when split method changes
  const splitMethodRadios = document.querySelectorAll('input[name="splitMethod"]');
  splitMethodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      handleSplitMethodChange();
      updateExpenseSummaryFromForm();
    });
  });

  // Update when paid by changes
  const paidBySelect = document.getElementById('expensePaidBy');
  if (paidBySelect) {
    paidBySelect.addEventListener('change', updateExpenseSummaryFromForm);
  }

  // Update when member selection changes
  const membersContainer = document.getElementById('expenseMembersCheckboxes');
  if (membersContainer) {
    membersContainer.addEventListener('change', () => {
      const method = document.querySelector('input[name="splitMethod"]:checked')?.value || 'equitable';
      if (method === 'percentage') {
        updatePercentageInputs();
      }
      updateExpenseSummaryFromForm();
    });
  }
}

/**
 * Helper function to update expense summary from current form values
 */
function updateExpenseSummaryFromForm() {
  const amount = parseFloat(document.getElementById('expenseAmount')?.value) || 0;
  const paidById = Number(document.getElementById('expensePaidBy')?.value);
  const checkboxes = document.querySelectorAll('#expenseMembersCheckboxes input[type="checkbox"]:checked');
  const selectedIds = Array.from(checkboxes).map(cb => Number(cb.value));
  const method = document.querySelector('input[name="splitMethod"]:checked')?.value || 'equitable';
  
  updateExpenseSummary(amount, paidById, selectedIds, method);
}

/**
* Helper and context 
*/
const API_BASE_DASH = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '/api';
// Prefer AuthHelper token, fallback to legacy key 'token'
const authToken = () => (window.AuthHelper && AuthHelper.getToken && AuthHelper.getToken()) || localStorage.getItem('token') || '';
// Prefer persisted 'user' from login flow
const currentUser = () => {
try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};
const CURRENT_USER_ID = () => (currentUser()?.id || currentUser()?.user_id || 0); // 0 if unknown
const CURRENT_USERNAME = () => (currentUser()?.username || '');

async function apiFetch(path, { method = 'GET', body } = {}) {
const res = await fetch(`${API_BASE_DASH}${path}`, {
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(authToken() ? { Authorization: `Bearer ${authToken()}` } : {})
  },
  body: body ? JSON.stringify(body) : undefined
});
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || err.error || (err.errors?.[0]?.msg) || `HTTP ${res.status}`);
}
return res.json().catch(() => ({}));
}

// Cache of users for username resolution
let __usersCache = null;
async function fetchAllUsers() {
if (__usersCache) return __usersCache;
__usersCache = await apiFetch('/users');
return __usersCache;
}

function resolveUserByUsername(users, username) {
if (!Array.isArray(users) || !username) return null;
const uname = String(username).trim();
return users.find(u => (u.username || '').toLowerCase() === uname.toLowerCase()) || null;
}

// Helper to obtain the active group ID (fallback to persisted value)
function getActiveGroupId() {
const fromState = (window.currentGroup && (window.currentGroup.group_id ?? window.currentGroup.id)) || null;
const fromDom = document.getElementById('groupDetailsSection')?.getAttribute('data-active-group-id') || null;
const fromStorage = Number(localStorage.getItem('active_group_id') || 0) || null;
return Number(fromState || fromDom || fromStorage || 0);
}

// ========================================
// GLOBAL STATE
// ========================================

const user = {
  id: "you",
  name: "You"
};

let currentGroup = null;

// ========================================
// NAVIGATION MANAGEMENT
// ========================================

/**
* Hides the dashboard view and shows the group details view.
* @param {object} group - The group object to display.
*/
function showGroupDetails(group) {
  currentGroup = group;
  try { window.currentGroup = group; } catch (_) {}
  document.getElementById('groupsSection').classList.add('is-hidden');
  document.getElementById('groupDetailsSection').classList.remove('is-hidden');
  try {
    document.getElementById('groupDetailsSection')?.setAttribute('data-active-group-id', String(group.group_id || group.id || ''));
    localStorage.setItem('active_group_id', String(group.group_id || group.id || ''));
  } catch (_) {}
  
  // Populate group details
  const gname = group.name || group.group_name || '';
  document.getElementById('groupNameTitle').textContent = gname;
  document.getElementById('groupDetailsAvatar').textContent = gname.substring(0, 2).toUpperCase();
  document.getElementById('groupMembers').textContent = `${(group.members||[]).length} members`;
  document.getElementById('totalExpenses').textContent = `$${Number(group.totalExpenses||0).toFixed(2)}`;
  document.getElementById('youOwe').textContent = `$${Number(group.youOwe||0).toFixed(2)}`;
  document.getElementById('youAreOwed').textContent = `$${Number(group.youAreOwed||0).toFixed(2)}`;
}

/**
* Hides the group details view and shows the dashboard.
*/
function showDashboard() {
  document.getElementById('groupDetailsSection').classList.add('is-hidden');
  document.getElementById('groupsSection').classList.remove('is-hidden');
}

// ============================
// Group details loading & Expense creation
// ============================
// Load groups for current user and render dashboard cards
async function loadUserGroups() {
const userId = CURRENT_USER_ID();
if (!userId) return;
try {
  const groups = await apiFetch(`/expense_groups/user/${userId}`);
  window.groups = (Array.isArray(groups) ? groups : []);
  renderGroupsGrid(window.groups);
} catch (e) {
  console.warn('Failed to load user groups:', e);
}
}

function renderGroupsGrid(groups) {
const grid = document.getElementById('groupsGrid');
if (!grid) return;
// Preserve the add-group card
const addCard = grid.querySelector('.add-group-card');
grid.innerHTML = '';
if (addCard) grid.appendChild(addCard);

(groups || []).forEach(g => {
  const card = document.createElement('div');
  card.className = 'group-card';
  const name = g.group_name || g.name || `Group ${g.group_id}`;
  card.innerHTML = `
    <div class="group-header">
      <div class="group-avatar">${String(name).substring(0,2).toUpperCase()}</div>
      <div class="group-info">
        <h3>${name}</h3>
        <p></p>
      </div>
    </div>
  `;
  card.onclick = () => loadAndShowGroupDetails(g.group_id || g.id);
  grid.insertBefore(card, grid.querySelector('.add-group-card'));
});
}
// Load group data from backend and navigate to details
async function loadAndShowGroupDetails(groupId) {
try {
  // 1) Basic group info (endpoint returns either a row or an array)
  let groupInfo = await apiFetch(`/expense_groups/${groupId}`);
  if (Array.isArray(groupInfo)) groupInfo = groupInfo[0] || {};

  // 2) Members
  const memberships = await apiFetch(`/memberships/group/${groupId}`);
  const members = (memberships || []).map(r => ({
    id: r.user_id,
    name: r.user_name || r.username || `User ${r.user_id}`
  }));

  // 3) Totals and balance
  let totalExpenses = 0;
  try {
    const expenses = await apiFetch(`/expenses/group/${groupId}`);
    totalExpenses = (Array.isArray(expenses) ? expenses : []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  } catch (_) {}

  let youOwe = 0, youAreOwed = 0;
  try {
    const bal = await apiFetch(`/settlements/balance/group/${groupId}/user/${CURRENT_USER_ID()}`);
    const val = Number(bal?.net ?? bal?.balance ?? bal?.amount ?? 0);
    if (val >= 0) { youAreOwed = val; } else { youOwe = Math.abs(val); }
  } catch (_) {}

  const group = {
    id: groupInfo.group_id || groupId,
    group_id: groupInfo.group_id || groupId,
    name: groupInfo.group_name || groupInfo.name || '',
    members,
    totalExpenses,
    youOwe,
    youAreOwed
  };
  try { localStorage.setItem('active_group_id', String(group.group_id)); } catch (_) {}
  showGroupDetails(group);
  
  // Load member balances, debt breakdown and transaction history after showing group details
  await loadMemberBalances(group.group_id);
  await loadDebtBreakdown(group.group_id);
  await loadTransactionHistory(group.group_id);
} catch (e) {
  showNotification('Failed to load group details', 'error');
}
}

// Create expense with optional participants and refresh details
async function addExpense() {
  const group_id = getActiveGroupId();
  const expense_name = (document.getElementById('expenseName')?.value || '').trim();
  const description = (document.getElementById('expenseDescription')?.value || '').trim();
  const category = (document.getElementById('expenseCategory')?.value || '').trim();
  const date = document.getElementById('expenseDate')?.value;
  const amount = parseFloat(document.getElementById('expenseAmount')?.value);
  const paid_by = Number(document.getElementById('expensePaidBy')?.value);

  // Obtén los participantes seleccionados
  const checkboxes = document.querySelectorAll('#expenseMembersCheckboxes input[type="checkbox"]:checked');
  const selectedIds = Array.from(checkboxes).map(cb => Number(cb.value));
  if (!selectedIds.length) return showNotification('Select at least one participant.', 'error');

  // CRÍTICO: Asegurar que el pagador esté incluido en participantes
  if (!selectedIds.includes(paid_by)) {
    selectedIds.push(paid_by);
    console.log(`[Frontend] Auto-added payer (${paid_by}) to participants`);
  }

  const method = document.querySelector('input[name="splitMethod"]:checked')?.value || 'equitable';

  let participants = [];
  if (method === 'equitable') {
      const per = Math.round((amount / selectedIds.length) * 100) / 100;
      participants = selectedIds.map(uid => ({ user_id: uid, share_amount: per }));
  } else {
      const inputs = Array.from(document.querySelectorAll('#percentageInputs input'));
      const membersOrder = selectedIds;
      const selectedPercents = selectedIds.map((uid, idx) => {
          const val = parseFloat(inputs[idx]?.value || '0');
          return isNaN(val) ? 0 : val;
      });
      const sumPct = selectedPercents.reduce((a,b)=>a+b,0);
      if (Math.round(sumPct) !== 100) return showNotification('Percentages must sum to 100% for selected members', 'error');
      participants = selectedIds.map((uid, idx) => {
          const pct = parseFloat(inputs[idx]?.value || '0');
          const share = Math.round((amount * ((isNaN(pct)?0:pct)/100)) * 100) / 100;
          return { user_id: uid, share_amount: share };
      });
  }

  try {
      await apiFetch('/expenses', { method: 'POST', body: { group_id, paid_by, amount, description, category, date, expense_name, participants } });
      showNotification('Expense created successfully!', 'success');
      closeAddExpenseModal();
      await loadAndShowGroupDetails(group_id);
      await loadMemberBalances(group_id);
      await loadDebtBreakdown(group_id);
      await loadTransactionHistory(group_id);
  } catch (err) {
      showNotification(err.message, 'error');
  }
}

// ...

// ========================================
// MODAL MANAGEMENT
// ========================================

/**
* Shows the group creation modal.
*/
function showCreateGroupModal() {
  const modal = document.getElementById('createGroupModal');
  if (modal) {
      modal.classList.add('is-active');
  }
}

/**
* Closes the group creation modal and resets the form.
*/
function closeCreateGroupModal() {
  const modal = document.getElementById('createGroupModal');
  if (modal) {
      modal.classList.remove('is-active');
      resetCreateGroupForm();
  }
}

/**
* Resets the create group modal form and member tags to initial state.
*/
function resetCreateGroupForm() {
// Text inputs
const nameInput = document.getElementById('groupName');
if (nameInput) nameInput.value = '';

// Category back to 'other' and refresh dynamic fields
const catSel = document.getElementById('groupCategory');
if (catSel) {
  catSel.value = 'other';
  handleCategoryChange();
}

// Clear dynamic specific inputs if present
const relName = document.getElementById('relationshipName');
if (relName) relName.value = '';
const yourIncome = document.getElementById('yourIncome');
if (yourIncome) yourIncome.value = '';
const partnerIncome = document.getElementById('partnerIncome');
if (partnerIncome) partnerIncome.value = '';

const tripDestination = document.getElementById('tripDestination');
if (tripDestination) tripDestination.value = '';
const tripStartPoint = document.getElementById('tripStartPoint');
if (tripStartPoint) tripStartPoint.value = '';
const tripDepartureDate = document.getElementById('tripDepartureDate');
if (tripDepartureDate) tripDepartureDate.value = '';
const tripArrivalDate = document.getElementById('tripArrivalDate');
if (tripArrivalDate) tripArrivalDate.value = '';

// Clear member tags and input
const memberTags = document.getElementById('memberTags');
if (memberTags) memberTags.innerHTML = '';
const addMemberInput = document.getElementById('addMemberInput');
if (addMemberInput) addMemberInput.value = '';
clearMemberSuggestions();
}

/**
* Shows the add payment modal and populates member lists.
*/
function showAddPaymentModal() {
  const modal = document.getElementById('addPaymentModal');
  if (modal) {
      const members = (currentGroup && currentGroup.members) || [];
      if (members.length < 2) {
        showNotification('You need at least 2 members to record a payment.', 'error');
        return;
      }
      populateMemberSelects('paymentFrom', members);
      populateMemberSelects('paymentTo', members);
      modal.classList.add('is-active');
  }
}

/**
* Closes the add payment modal and resets the form.
*/
function closeAddPaymentModal() {
  const modal = document.getElementById('addPaymentModal');
  if (modal) {
      modal.classList.remove('is-active');
  }
  document.getElementById('addPaymentForm').reset();
}

/**
* Shows the add expense modal and populates member lists.
*/
async function showAddExpenseModal() {
  const modal = document.getElementById('addExpenseModal');
  const groupId = getActiveGroupId();
  if (!groupId) {
      showNotification('No hay grupo activo.', 'error');
      return;
  }
  await prepareAddExpenseModal(groupId);
  if (modal) modal.classList.add('is-active');
}

/**
* Closes the add expense modal and resets the form.
*/
function closeAddExpenseModal() {
  const modal = document.getElementById('addExpenseModal');
  if (modal) {
      modal.classList.remove('is-active');
  }
  document.getElementById('addExpenseForm').reset();
}

/**
 * Shows the add members modal and populates it with current members.
 */
function showAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
        // Clear previous tags and populate with existing members
        const memberTagsContainer = document.getElementById('modalMemberTags');
        memberTagsContainer.innerHTML = '';

        currentGroup.members.forEach(member => {
            addMemberToTags(member.name, 'modalMemberTags');
        });
        
        // Add event listener for the modal's input
        const addMemberInput = document.getElementById('addModalMemberInput');
        if (addMemberInput) {
            // Remove previous event listener to prevent duplicates
            const oldHandler = addMemberInput.onkeydown;
            if (oldHandler) addMemberInput.removeEventListener('keydown', oldHandler);
            
            addMemberInput.addEventListener('keydown', (e) => handleAddMember(e, 'modalMemberTags'));
        }

        modal.classList.add('is-active');
    }
}

/**
 * Closes the add member modal.
 */
function closeAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) {
        modal.classList.remove('is-active');
    }
}

/**
 * Handles adding new members to the group after the modal is closed.
 */
async function addMembersToGroup() {
    // Get the users from the tags in the modal
    const modalMemberTags = document.querySelectorAll('#modalMemberTags .tag');
    const memberNames = Array.from(modalMemberTags).map(tag => tag.textContent.trim().replace(/\s*×\s*$/, ''));
    
    const usersToAdd = [];
    const notFound = [];

    // Filter out users that are already in the group or are the current user
    const existingMemberIds = currentGroup.members.map(m => m.id);
    const currentUser = CURRENT_USER_ID();
    
    for (const name of memberNames) {
        // If it's the current user, skip and continue
        if (name.toLowerCase() === 'you') continue;

        try {
            const userMatches = await apiFetch(`/users/search?query=${encodeURIComponent(name)}&limit=1`);
            const user = Array.isArray(userMatches) ? userMatches[0] : null;

            // Check if the user exists and isn't already a member or the current user
            if (user && user.user_id && !existingMemberIds.includes(user.user_id) && user.user_id !== currentUser) {
                usersToAdd.push(user);
                existingMemberIds.push(user.user_id); // Prevent adding duplicates in this session
            } else if (!user) {
                notFound.push(name);
            } else if (user.user_id === currentUser) {
                // Don't add to notFound, just silently skip current user
                console.log(`Skipping current user: ${name}`);
            }
        } catch (e) {
            notFound.push(name);
        }
    }

    if (notFound.length > 0) {
        showNotification(`The following members were not found or couldn't be added: ${notFound.join(', ')}`, 'error');
    }
    
    // Check if there are any new members to add to the group
    if (usersToAdd.length > 0) {
        try {
            const memberships = usersToAdd.map(u => ({ group_id: currentGroup.id, user_id: u.user_id }));
            
            // Loop through and add each member to the group via the API
            for (const member of memberships) {
                await apiFetch('/memberships', { method: 'POST', body: member });
            }

            // Update the local state with the newly added members
            const newMembersData = usersToAdd.map(u => ({ id: u.user_id, name: u.username }));
            currentGroup.members = [...currentGroup.members, ...newMembersData];

            // Update the member count on the details page
            document.getElementById('groupMembers').textContent = `${currentGroup.members.length} members`;
            
            showNotification('Members added successfully!', 'success');
        } catch (e) {
            showNotification(`An error occurred while adding members: ${e.message}`, 'error');
        }
    }
    
    closeAddMemberModal();
    // After adding members and closing the modal, you should refresh the group details view
    await loadAndShowGroupDetails(currentGroup.id);
}
/**
 * Handles editing the group name.
 * Prompts the user for a new name and updates the UI and backend.
 */
async function editGroupName() {
    const newName = prompt("Enter a new name for the group:", currentGroup.name);
    if (newName && newName.trim() !== "" && newName.trim() !== currentGroup.name) {
        try {
            // Update the name in the backend
            await apiFetch(`/expense_groups/${currentGroup.id || currentGroup.group_id}`, { 
                method: 'PUT',
                body: { group_name: newName.trim() } 
            });

            // Update the local state
            currentGroup.name = newName.trim();
            document.getElementById('groupNameTitle').textContent = currentGroup.name;
            document.getElementById('groupDetailsAvatar').textContent = currentGroup.name.substring(0, 2).toUpperCase();
            
            // Re-render the dashboard to reflect the change
            await loadUserGroups();

            showNotification(`Group name changed to "${currentGroup.name}"`, 'success');
        } catch (e) {
            showNotification(`Failed to update group name: ${e.message}`, 'error');
        }
    }
}

/**
* Handles the change event of the group category select dropdown.
* Dynamically adds form fields based on the selected category.
*/
function handleCategoryChange() {
  const category = document.getElementById('groupCategory').value;
  const dynamicFormSection = document.getElementById('dynamicFormSection');
  dynamicFormSection.innerHTML = ''; // Clear previous content

  if (category === 'relationship') {
      dynamicFormSection.innerHTML = `
          <div class="field">
              <label class="label">Relationship Name</label>
              <div class="control">
                  <input class="input" type="text" id="relationshipName" placeholder="e.g., My Partner" required>
              </div>
          </div>
          <div class="field">
              <label class="label">Your Income ($)</label>
              <div class="control">
                  <input class="input" type="number" id="yourIncome" placeholder="e.g., 50000" min="0">
              </div>
          </div>
          <div class="field">
              <label class="label">Partner's Income ($)</label>
              <div class="control">
                  <input class="input" type="number" id="partnerIncome" placeholder="e.g., 60000" min="0">
              </div>
          </div>
      `;
  } else if (category === 'trip') {
      dynamicFormSection.innerHTML = `
          <div class="field">
              <label class="label">Destination</label>
              <div class="control">
                  <input class="input" type="text" id="tripDestination" placeholder="e.g., Paris" required>
              </div>
          </div>
          <div class="field">
              <label class="label">Starting Point</label>
              <div class="control">
                  <input class="input" type="text" id="tripStartPoint" placeholder="e.g., Home" required>
              </div>
          </div>
          <div class="field">
              <label class="label">Departure Date</label>
              <div class="control">
                  <input class="input" type="date" id="tripDepartureDate" required>
              </div>
          </div>
          <div class="field">
              <label class="label">Arrival Date</label>
              <div class="control">
                  <input class="input" type="date" id="tripArrivalDate" required>
              </div>
          </div>
      `;
  }
}

/**
* Handles the change of the split method for expenses.
* Shows or hides the percentage inputs based on the selection.
*/
function handleSplitMethodChange() {
  const method = document.querySelector('input[name="splitMethod"]:checked')?.value || 'equitable';
  const percentageSection = document.getElementById('percentageSplitSection');
  const percentageInputsDiv = document.getElementById('percentageInputs');
  if (!percentageSection || !percentageInputsDiv) return;

  if (method === 'percentage') {
      percentageSection.style.display = 'block';
      updatePercentageInputs();
  } else {
      percentageSection.style.display = 'none';
      percentageInputsDiv.innerHTML = '';
  }
}

/**
 * Updates percentage inputs based on selected members
 */
function updatePercentageInputs() {
  const percentageInputsDiv = document.getElementById('percentageInputs');
  if (!percentageInputsDiv) return;

  // Get selected members
  const checkboxes = document.querySelectorAll('#expenseMembersCheckboxes input[type="checkbox"]:checked');
  const selectedIds = Array.from(checkboxes).map(cb => Number(cb.value));
  const members = (currentGroup && currentGroup.members) || [];
  const selectedMembers = members.filter(m => selectedIds.includes(m.id) || selectedIds.includes(m.user_id));

  percentageInputsDiv.innerHTML = '';
  
  if (selectedMembers.length === 0) {
    percentageInputsDiv.innerHTML = '<p class="has-text-grey">Select members first to set percentages</p>';
    return;
  }

  const defaultPercentage = Math.round(100 / selectedMembers.length);
  
  selectedMembers.forEach((member, index) => {
      const isLast = index === selectedMembers.length - 1;
      const percentage = isLast ? 100 - (defaultPercentage * (selectedMembers.length - 1)) : defaultPercentage;
      
      const inputHTML = `
          <div class="field is-horizontal">
              <div class="field-label is-normal">
                  <label class="label">${member.name}</label>
              </div>
              <div class="field-body">
                  <div class="field has-addons">
                      <div class="control is-expanded">
                          <input class="input percentage-input" type="number" placeholder="%" min="0" max="100" value="${percentage}">
                      </div>
                      <div class="control">
                          <a class="button is-static">%</a>
                      </div>
                  </div>
              </div>
          </div>
      `;
      percentageInputsDiv.insertAdjacentHTML('beforeend', inputHTML);
  });

  // Add event listeners to percentage inputs
  const percentageInputs = percentageInputsDiv.querySelectorAll('.percentage-input');
  percentageInputs.forEach(input => {
    input.addEventListener('input', updateExpenseSummaryFromForm);
  });
}


/**
* Llena el select de "Paid by" con los miembros del grupo.
* @param {Array} members - Array de miembros.
*/
function populatePaidBySelect(members) {
  const paidBySelect = document.getElementById('expensePaidBy');
  if (!paidBySelect) return;
  paidBySelect.innerHTML = '<option value="">Select who paid...</option>';
  const currentUserId = CURRENT_USER_ID();
  
  members.forEach(member => {
      const option = document.createElement('option');
      const memberId = member.id || member.user_id;
      option.value = memberId;
      option.textContent = member.name || member.username || `User ${memberId}`;
      
      // Auto-select current user
      if (memberId === currentUserId) {
          option.selected = true;
      }
      
      paidBySelect.appendChild(option);
  });
  
  // Trigger change event to update participants
  paidBySelect.dispatchEvent(new Event('change'));
}

/**
* Llena el select de participantes del gasto.
* @param {string} selectId - ID del select.
* @param {Array} members - Array de miembros.
*/
function populateMemberSelects(selectId, members) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '';
  const currentUserId = CURRENT_USER_ID();
  
  members.forEach(member => {
      const option = document.createElement('option');
      const memberId = member.id || member.user_id;
      option.value = memberId;
      option.textContent = member.name || member.username || `User ${memberId}`;
      
      // Auto-select current user for "from" field in payments
      if (selectId === 'paymentFrom' && memberId === currentUserId) {
          option.selected = true;
      }
      
      select.appendChild(option);
  });
}

function populateMembersCheckboxes(members) {
  const container = document.getElementById('expenseMembersCheckboxes');
  if (!container) return;
  container.innerHTML = '';
  const currentUserId = CURRENT_USER_ID();
  
  members.forEach(member => {
      const memberId = member.id || member.user_id;
      const memberName = member.name || member.username || `User ${memberId}`;
      const label = document.createElement('label');
      label.className = 'checkbox';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = memberId;
      
      // Auto-check current user (payer)
      if (memberId === currentUserId) {
          checkbox.checked = true;
      }
      
      // Add event listener to update expense summary
      checkbox.addEventListener('change', updateExpenseSummaryFromForm);
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + memberName));
      container.appendChild(label);
  });
  
  // Reset expense summary when members are repopulated
  updateExpenseSummary(0, 0, [], 'equitable');
}

// ========================================
// MEMBER BALANCES FUNCTIONS
// ========================================

async function loadMemberBalances(groupId) {
  try {
    const balances = await apiFetch(`/settlements/balances/group/${groupId}`);
    renderMemberBalances(balances);
  } catch (error) {
    console.error('Error loading member balances:', error);
    document.getElementById('memberBalancesList').innerHTML = 
      '<div class="balance-item"><span class="has-text-danger">Error loading balances</span></div>';
  }
}

function renderMemberBalances(balances) {
  const container = document.getElementById('memberBalancesList');
  
  if (!balances || balances.length === 0) {
    container.innerHTML = '<div class="balance-item"><span class="has-text-grey">No balances found</span></div>';
    return;
  }

  container.innerHTML = balances.map(balance => {
    const amount = Number(balance.net || 0);
    const amountClass = amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'zero';
    const initials = balance.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return `
      <div class="balance-item">
        <div class="balance-user-info">
          <div class="balance-avatar">${initials}</div>
          <span class="balance-name">${balance.name}</span>
        </div>
        <span class="balance-amount ${amountClass}">$${Math.abs(amount).toFixed(2)}</span>
      </div>
    `;
  }).join('');
}

async function loadDebtBreakdown(groupId) {
  try {
    const balances = await apiFetch(`/settlements/balances/group/${groupId}`);
    renderDebtBreakdown(balances);
  } catch (error) {
    console.error('Error loading debt breakdown:', error);
    document.getElementById('debtBreakdownList').innerHTML = 
      '<div class="debt-item"><span class="has-text-danger">Error loading debt breakdown</span></div>';
  }
}

function renderDebtBreakdown(balances) {
  const container = document.getElementById('debtBreakdownList');
  const currentUserId = CURRENT_USER_ID();
  
  if (!balances || balances.length === 0) {
    container.innerHTML = '<div class="debt-item"><span class="has-text-grey">No debts found</span></div>';
    return;
  }

  // Find current user's balance
  const currentUser = balances.find(b => b.user_id === currentUserId);
  const currentUserBalance = Number(currentUser?.net || 0);
  
  // Create debt relationships
  const debts = [];
  
  balances.forEach(balance => {
    const amount = Number(balance.net || 0);
    const userId = balance.user_id;
    
    if (userId === currentUserId) return; // Skip self
    
    if (currentUserBalance < 0 && amount > 0) {
      // Current user owes this person
      const owedAmount = Math.min(Math.abs(currentUserBalance), amount);
      if (owedAmount > 0.01) {
        debts.push({
          type: 'you-owe',
          description: `You owe ${balance.name}`,
          amount: owedAmount
        });
      }
    } else if (currentUserBalance > 0 && amount < 0) {
      // This person owes current user
      const owedAmount = Math.min(currentUserBalance, Math.abs(amount));
      if (owedAmount > 0.01) {
        debts.push({
          type: 'owes-you',
          description: `${balance.name} owes you`,
          amount: owedAmount
        });
      }
    }
  });

  if (debts.length === 0) {
    container.innerHTML = '<div class="debt-item"><span class="has-text-grey">All debts settled!</span></div>';
    return;
  }

  container.innerHTML = debts.map(debt => `
    <div class="debt-item ${debt.type}">
      <div class="debt-description">
        <span>${debt.description}</span>
        <span class="debt-arrow">→</span>
      </div>
      <span class="debt-amount ${debt.type}">$${debt.amount.toFixed(2)}</span>
    </div>
  `).join('');
}

// ========================================
// TRANSACTION HISTORY
// ========================================

let currentTransactionFilter = 'all';

/**
 * Loads and displays transaction history for a group
 */
async function loadTransactionHistory(groupId) {
  try {
    const [expenses, settlements] = await Promise.all([
      apiFetch(`/expenses/group/${groupId}`).catch(() => []),
      apiFetch(`/settlements/group/${groupId}`).catch(() => [])
    ]);

    const transactions = [];

    // Add expenses
    (expenses || []).forEach(expense => {
      transactions.push({
        type: 'expense',
        id: expense.expense_id,
        title: expense.expense_name || 'Expense',
        description: expense.description || '',
        amount: Number(expense.amount || 0),
        paidBy: expense.paid_by_name || `User ${expense.paid_by}`,
        date: new Date(expense.date || expense.created_at),
        category: expense.category || 'General'
      });
    });

    // Add settlements/payments
    (settlements || []).forEach(settlement => {
      transactions.push({
        type: 'payment',
        id: settlement.settlement_id,
        title: 'Payment',
        description: `${settlement.from_user_name || `User ${settlement.from_user}`} → ${settlement.to_user_name || `User ${settlement.to_user}`}`,
        amount: Number(settlement.amount || 0),
        paidBy: settlement.from_user_name || `User ${settlement.from_user}`,
        date: new Date(settlement.created_at),
        category: 'Payment'
      });
    });

    // Sort by date (newest first)
    transactions.sort((a, b) => b.date - a.date);

    // Store for filtering
    window.allTransactions = transactions;
    
    // Display transactions
    renderTransactions(transactions);
    
  } catch (error) {
    console.error('Error loading transaction history:', error);
    document.getElementById('transactionList').innerHTML = `
      <div class="transaction-item">
        <i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>
        <span>Error loading transactions</span>
      </div>
    `;
  }
}

/**
 * Renders transactions in the UI
 */
function renderTransactions(transactions) {
  const container = document.getElementById('transactionList');
  if (!container) return;

  if (!transactions || transactions.length === 0) {
    container.innerHTML = `
      <div class="transaction-item">
        <i class="fas fa-info-circle" style="color: var(--text-secondary);"></i>
        <span>No transactions yet</span>
      </div>
    `;
    return;
  }

  container.innerHTML = transactions.map(transaction => {
    const isExpense = transaction.type === 'expense';
    const icon = isExpense ? 'fas fa-shopping-cart' : 'fas fa-exchange-alt';
    const iconClass = isExpense ? 'expense' : 'payment';
    
    const dateStr = transaction.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const timeStr = transaction.date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `
      <div class="transaction-item">
        <div class="transaction-icon ${iconClass}">
          <i class="${icon}"></i>
        </div>
        <div class="transaction-details">
          <div class="transaction-title">${transaction.title}</div>
          <div class="transaction-meta">
            By ${transaction.paidBy} • ${dateStr} at ${timeStr}
            ${transaction.description ? `<br><small>${transaction.description}</small>` : ''}
          </div>
        </div>
        <div class="transaction-amount">
          $${transaction.amount.toFixed(2)}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Shows transactions filtered by type
 */
function showTransactionTab(filter) {
  currentTransactionFilter = filter;
  
  // Update tab appearance
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab${filter.charAt(0).toUpperCase() + filter.slice(1)}`).classList.add('active');
  
  // Filter and display transactions
  const allTransactions = window.allTransactions || [];
  let filtered = allTransactions;
  
  if (filter === 'expenses') {
    filtered = allTransactions.filter(t => t.type === 'expense');
  } else if (filter === 'payments') {
    filtered = allTransactions.filter(t => t.type === 'payment');
  }
  
  renderTransactions(filtered);
}

// ========================================
// GROUP CREATION LOGIC
// ========================================
/**
* Handles the creation of a new group.
* Gathers form data, validates it, and creates memberships.
*/
async function createGroup() {
const groupName = document.getElementById('groupName').value.trim();
const groupCategory = document.getElementById('groupCategory').value;
const members = getMembers(); 

if (!groupName) {
  showNotification('Group name is required.', 'error');
  return;
}

// Resolve and validate members: ensure at least one additional valid user besides the creator
const creatorUname = CURRENT_USERNAME();
const inputMembers = (members || [])
  .filter(m => m && m !== 'You')
  .map(m => String(m).trim())
  .filter(Boolean);

const resolvedUsers = [];
const notFound = [];
for (const uname of inputMembers) {
  if (creatorUname && uname.toLowerCase() === creatorUname.toLowerCase()) continue;
  try {
    const matches = await apiFetch(`/users/search?query=${encodeURIComponent(uname)}&limit=3`);
    const exact = Array.isArray(matches) ? matches.find(u => (u.username||'').toLowerCase() === uname.toLowerCase()) : null;
    if (exact && exact.user_id) {
      if (!resolvedUsers.find(u => u.user_id === exact.user_id)) {
        resolvedUsers.push({ user_id: exact.user_id, username: exact.username });
      }
    } else {
      notFound.push(uname);
    }
  } catch (_) {
    notFound.push(uname);
  }
}

if (notFound.length) {
  showNotification(`Some users not found: ${notFound.join(', ')}`, 'error');
}

if (resolvedUsers.length === 0) {
  showNotification('Add at least one existing user by username to create a group.', 'error');
  return;
}

try {
  let path = '/expense_groups/other';
  let body = { 
    group_name: groupName, 
    created_by: CURRENT_USER_ID(), 
    category: groupCategory 
  };

  if (groupCategory === 'relationship') {
    path = '/expense_groups/relationship';
    body.relationship_name = (document.getElementById('relationshipName')?.value || '').trim();
    body.income_1 = Number(document.getElementById('yourIncome')?.value || 0);
    body.income_2 = Number(document.getElementById('partnerIncome')?.value || 0);
  } else if (groupCategory === 'trip') {
    path = '/expense_groups/trip';
    body.origin = (document.getElementById('tripStartPoint')?.value || '').trim();
    body.destination = (document.getElementById('tripDestination')?.value || '').trim();
    body.departure = document.getElementById('tripDepartureDate')?.value || null;
    body.trip_return = document.getElementById('tripArrivalDate')?.value || null;
  }

  // POST to backend
  const created = await apiFetch(path, { method: 'POST', body });

  // Create creator membership with admin role (owner)
  const newGroupId = created.group_id || created.id;
  if (newGroupId && CURRENT_USER_ID()) {
    try {
      await apiFetch('/memberships', { method: 'POST', body: { group_id: newGroupId, user_id: CURRENT_USER_ID(), role: 'admin' } });
    } catch (e) {
      // Non-fatal for UI, but notify
      console.warn('Membership creation failed:', e);
    }
  }

  // Create additional memberships from resolved users
  for (const u of resolvedUsers) {
    try {
      await apiFetch('/memberships', { method: 'POST', body: { group_id: newGroupId, user_id: u.user_id } });
    } catch (e) {
      console.warn(`Failed to add member ${u.username}:`, e);
    }
  }

  // Refresh UI and navigate to details
  closeCreateGroupModal();
  showNotification(`Group "${created.group_name || created.name || groupName}" created!`, 'success');
  await loadAndShowGroupDetails(newGroupId);
  // refresh groups list
  try { await loadUserGroups(); } catch (_) {}
} catch (err) {
  showNotification(err.message, 'error');
}
}


/**
* Renders a new group card on the dashboard.
* @param {object} groupData - The data for the new group.
*/
function renderGroupCard(groupData) {
  const groupsGrid = document.getElementById('groupsGrid');
  if (!groupsGrid) return;
  
  const newCardHTML = `
      <div class="group-card" onclick="showGroupDetails(groups.find(g => g.id === '${groupData.id}'))">
          <div class="group-header">
              <div class="group-avatar">${groupData.name.substring(0, 2).toUpperCase()}</div>
              <div class="group-info">
                  <h3>${groupData.name}</h3>
                  <p>${groupData.members.length} members</p>
              </div>
          </div>
          <div class="group-stats">
              <div class="stat-item">
                  <span class="stat-value">$${groupData.totalExpenses}</span>
                  <span class="stat-label">Total Expenses</span>
              </div>
              <div class="stat-item">
                  <span class="stat-value">$${groupData.youOwe}</span>
                  <span class="stat-label">You Owe</span>
              </div>
              <div class="stat-item">
                  <span class="stat-value">$${groupData.youAreOwed}</span>
                  <span class="stat-label">You're Owed</span>
              </div>
          </div>
      </div>
  `;

  const addGroupCard = groupsGrid.querySelector('.add-group-card');
  if (addGroupCard) {
      addGroupCard.insertAdjacentHTML('beforebegin', newCardHTML);
  } else {
      groupsGrid.innerHTML = newCardHTML;
  }
  
  // Add the new group to a global array for state management
  if (!window.groups) {
      window.groups = [];
  }
  window.groups.push(groupData);
}

/**
 * Updates the expense summary section with the calculated split
 * @param {number} amount - Total expense amount
 * @param {number} paidById - ID of the member who paid
 * @param {Array<number>} selectedIds - Array of selected member IDs
 * @param {string} method - Split method ('equitable' or 'percentage')
 */
function updateExpenseSummary(amount, paidById, selectedIds, method) {
  const container = document.getElementById('expenseBreakdown');
  if (!container) return;

  // If no amount or no selected members, show default message
  if (!amount || !selectedIds.length) {
    container.innerHTML = '<p class="has-text-grey">Select members and enter amount to see the split.</p>';
    return;
  }

  // Get member info
  const members = currentGroup?.members || [];
  const payer = members.find(m => m.id === paidById || m.user_id === paidById);
  const involvedMembers = members.filter(m => selectedIds.includes(m.id) || selectedIds.includes(m.user_id));

  // Calculate shares
  let shares = [];
  let totalPercentage = 0;
  
  if (method === 'percentage') {
    // Get percentage inputs
    const percentageInputs = Array.from(document.querySelectorAll('#percentageInputs input'));
    const percentages = [];
    
    // Validate percentages
    percentageInputs.forEach((input, index) => {
      const pct = parseFloat(input.value) || 0;
      percentages.push(pct);
      totalPercentage += pct;
    });

    // Validate total percentage
    if (Math.abs(totalPercentage - 100) > 0.1) {
      container.innerHTML = '<p class="has-text-danger">Total percentage must equal 100%</p>';
      return;
    }

    // Calculate shares based on percentages
    shares = involvedMembers.map((member, index) => {
      const pct = percentages[index] || 0;
      const share = (amount * pct) / 100;
      return { member, share, percentage: pct };
    });
  } else {
    // Equitable split
    const sharePerPerson = amount / selectedIds.length;
    shares = involvedMembers.map(member => ({
      member,
      share: sharePerPerson,
      percentage: 100 / selectedIds.length
    }));
  }

  // Generate HTML
  let html = `
    <div class="mb-3">
      <p class="has-text-weight-semibold">${payer?.name || 'Someone'} paid: <span class="has-text-primary">$${amount.toFixed(2)}</span></p>
      <p class="is-size-7 has-text-grey">Split ${method === 'percentage' ? 'by percentage' : 'equally'} among ${selectedIds.length} people</p>
    </div>
    <div class="breakdown-list">
  `;

  // Add each member's share
  shares.forEach(({ member, share, percentage }) => {
    const isPayer = member.id === paidById || member.user_id === paidById;
    const payerBadge = isPayer ? ' <span class="tag is-success is-light is-small">Paid</span>' : '';
    
    html += `
      <div class="is-flex is-justify-content-space-between is-align-items-center py-1">
        <span>${member.name}${payerBadge}</span>
        <span>
          <strong>$${share.toFixed(2)}</strong>
          <span class="has-text-grey"> (${percentage.toFixed(1)}%)</span>
        </span>
      </div>
    `;
  });

  // Add total
  const total = shares.reduce((sum, { share }) => sum + share, 0);
  const difference = Math.abs(total - amount);
  
  html += `
    </div>
    <div class="breakdown-total mt-3 pt-2" style="border-top: 1px solid #e5e7eb;">
      <div class="is-flex is-justify-content-space-between">
        <span class="has-text-weight-semibold">Total</span>
        <span class="has-text-weight-semibold">$${total.toFixed(2)}</span>
      </div>
  `;

  // Show rounding difference if any
  if (difference > 0.01) {
    html += `
      <div class="is-size-7 has-text-grey">
        <i>Note: Total adjusted by $${difference.toFixed(2)} due to rounding</i>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// ========================================
// MEMBER MANAGEMENT
// ========================================

/**
* Handles adding a new member to the tags list when the Enter key is pressed.
* @param {KeyboardEvent} e - The keydown event.
*/
function handleAddMember(e) {
  if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target;
      const memberName = input.value.trim();

      if (memberName) {
          addMemberToTags(memberName);
          input.value = '';
      }
  }
}

/**
* Adds a new member as a tag in the UI.
* @param {string} name - The name of the member to add.
*/
function addMemberToTags(name, containerId = 'memberTags') {
  const memberTagsContainer = document.getElementById(containerId);
  const currentUsername = CURRENT_USERNAME();
  
  // Prevent adding current user
  if (currentUsername && name.toLowerCase() === currentUsername.toLowerCase()) {
    showNotification('You cannot add yourself to the group', 'error');
    return;
  }
  
  // prevent duplicates
  const existing = Array.from(document.querySelectorAll(`#${containerId} .tag`))
    .map(t => t.textContent.trim().replace(/\s*×\s*$/, ''));
  if (existing.some(t => t.toLowerCase() === String(name).toLowerCase())) return;
  
  const newTagHTML = `
      <span class="tag is-info is-light">
          ${name}
          <button class="delete is-small" onclick="this.parentElement.remove();"></button>
      </span>
  `;
  memberTagsContainer.insertAdjacentHTML('beforeend', newTagHTML);
}

/**
* Retrieves the names of all members currently in the tags list.
* @returns {string[]} An array of member names.
*/
function getMembers() {
  const memberTags = document.querySelectorAll('#memberTags .tag');
  const members = ['You'];
  memberTags.forEach(tag => {
      const text = tag.textContent.trim();
      if (text && text !== 'You') { 
          members.push(text);
      }
  });
  return members;
}

// ========================================
// PAYMENT & EXPENSE LOGIC
// ========================================


/**
* Handles the submission of the add expense form.
*/
async function addPayment() {
const from = Number(document.getElementById('paymentFrom').value);
const to = Number(document.getElementById('paymentTo').value);
const amount = parseFloat(document.getElementById('paymentAmount').value);
const group_id = getActiveGroupId();

if (!group_id) return showNotification('No active group selected.', 'error');
if (!from || !to || isNaN(amount) || amount <= 0) {
  showNotification('Please fill in all fields with valid values.', 'error');
  return;
}
if (from === to) {
  showNotification('Payer and receiver must be different users.', 'error');
  return;
}

try {
  await apiFetch('/settlements', { method: 'POST', body: { group_id, from_user: from, to_user: to, amount } });
  showNotification('Payment recorded successfully!', 'success');
  closeAddPaymentModal();
  await loadAndShowGroupDetails(group_id);
  await loadMemberBalances(group_id);
  await loadDebtBreakdown(group_id);
  await loadTransactionHistory(group_id);
} catch (err) {
  showNotification(err.message, 'error');
}
}


// ========================================
// UTILITY FUNCTIONS (Reused from main.js)
// ========================================

// Debounce utility
function debounce(fn, wait = 250) {
let t;
return (...args) => {
  clearTimeout(t);
  t = setTimeout(() => fn.apply(null, args), wait);
};
}

// Autocomplete member search handlers
const handleMemberSearchInput = debounce(async (e) => {
const q = String(e.target.value || '').trim();
if (!q || q.length < 2) { clearMemberSuggestions(); return; }
try {
  const results = await apiFetch(`/users/search?query=${encodeURIComponent(q)}&limit=7`);
  renderMemberSuggestions(results || [], q);
} catch (_) {
  clearMemberSuggestions();
}
}, 250);

function ensureSuggestionContainer() {
let el = document.getElementById('addMemberSuggestions');
if (!el) {
  el = document.createElement('div');
  el.id = 'addMemberSuggestions';
  el.style.position = 'absolute';
  el.style.zIndex = '1002';
  el.style.background = 'white';
  el.style.border = '1px solid #ddd';
  el.style.borderRadius = '6px';
  el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
  el.style.minWidth = '240px';
  const input = document.getElementById('addMemberInput');
  input.parentElement.style.position = 'relative';
  input.parentElement.appendChild(el);
}
return el;
}

function renderMemberSuggestions(list, q) {
const el = ensureSuggestionContainer();
if (!list.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
const esc = (s) => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
el.innerHTML = list.map(u => `
  <div class="suggest-item" data-username="${esc(u.username)}" style="padding:8px 12px; cursor:pointer;">
    <div style="font-weight:600;">${esc(u.username)}</div>
    <div style="font-size:12px; color:#666;">${esc(u.email || '')} ${u.name ? '• ' + esc(u.name) : ''}</div>
  </div>
`).join('');
el.style.display = 'block';
Array.from(el.querySelectorAll('.suggest-item')).forEach(item => {
  item.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    const uname = item.getAttribute('data-username');
    if (uname) addMemberToTags(uname);
    const input = document.getElementById('addMemberInput');
    if (input) input.value = '';
    clearMemberSuggestions();
  });
});
}

function clearMemberSuggestions() {
const el = document.getElementById('addMemberSuggestions');
if (el) { el.innerHTML = ''; el.style.display = 'none'; }
}

/**
* Displays a temporary notification message to the user.
* @param {string} message - The message to display.
* @param {string} type - The type of notification ('info', 'success', 'error').
*/
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const bgColor = type === 'error' ? '#ef4444' :
      type === 'success' ? '#10b981' : '#3b82f6';

  notification.innerHTML = `
      <div style="position: fixed; top: 100px; left: 50%; transform: translateX(-50%); 
                  background: ${bgColor}; color: white; padding: 15px 25px; 
                  border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
                  z-index: 1003; font-weight: 600;">
          ${message}
      </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
      if (document.body.contains(notification)) {
          document.body.removeChild(notification);
      }
  }, 4000);
}

/**
* Toggles the website theme between light and dark.
* This function is re-used from main.js to ensure consistency.
*/
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  const metaThemeColor = document.querySelector('meta[name=theme-color]');
  if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#0f172a' : '#4DF7EC');
  }
}

/**
 * Initializes the user avatar. It now uses the user's initials instead of fetching a random image.
 */
function initializeUserAvatar() {
    const avatarElement = document.getElementById('userAvatar');
    if (!avatarElement) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const username = user ? user.username : 'U';
      if (username && username.length > 0) {
          avatarElement.textContent = username.charAt(0).toUpperCase();
      }
    } catch (e) {
      avatarElement.textContent = 'U'; // Fallback en caso de error
    }
}


// Expose functions for inline handlers in dashboard.html
try {
window.showCreateGroupModal = showCreateGroupModal;
window.closeCreateGroupModal = closeCreateGroupModal;
window.showAddPaymentModal = showAddPaymentModal;
window.closeAddPaymentModal = closeAddPaymentModal;
window.showAddExpenseModal = showAddExpenseModal;
window.closeAddExpenseModal = closeAddExpenseModal;
window.createGroup = createGroup;
window.addExpense = addExpense;
window.addPayment = addPayment;
window.showDashboard = showDashboard;
window.toggleTheme = window.toggleTheme || toggleTheme;
window.showTransactionTab = showTransactionTab;
} catch (_) {}

// ========================================
// GROUP MEMBERS FETCHING & USAGE
// ========================================

/**
* Prepara el modal de gastos con los miembros del grupo actual.
* @param {number} groupId - El ID del grupo.
*/
async function prepareAddExpenseModal(groupId) {
  const members = (currentGroup && currentGroup.members) || [];
  if (members.length < 1) {
      showNotification('No hay miembros en el grupo.', 'error');
      return;
  }
  populatePaidBySelect(members);
  populateMembersCheckboxes(members);
  handleSplitMethodChange();
}