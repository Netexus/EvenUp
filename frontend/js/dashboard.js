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

    // Add event listener for expense split method
    const splitMethodRadios = document.getElementsByName('splitMethod');
    splitMethodRadios.forEach(radio => {
        radio.addEventListener('change', handleSplitMethodChange);
    });
});

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
let groupMembers = [];

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
          <p>${(g.members||[]).length} members</p>
        </div>
      </div>
      <div class="group-stats">
          <div class="stat-item">
              <span class="stat-value">$${Number(g.totalExpenses || 0).toFixed(2)}</span>
              <span class="stat-label">Total Expenses</span>
          </div>
          <div class="stat-item">
              <span class="stat-value">$${Number(g.youOwe || 0).toFixed(2)}</span>
              <span class="stat-label">You Owe</span>
          </div>
          <div class="stat-item">
              <span class="stat-value">$${Number(g.youAreOwed || 0).toFixed(2)}</span>
              <span class="stat-label">You're Owed</span>
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
    } catch (err) {
        showNotification(err.message, 'error');
    }
}


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
  if (memberTags) memberTags.innerHTML = `
      <span class="tag is-primary">
          You
          <button class="delete is-small"></button>
      </span>
  `;
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

            // Check if the user exists and isn't already a member
            if (user && user.user_id && !existingMemberIds.includes(user.user_id) && user.user_id !== currentUser) {
                usersToAdd.push(user);
                existingMemberIds.push(user.user_id); // Prevent adding duplicates in this session
            } else if (!user) {
                notFound.push(name);
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
    const members = (currentGroup && currentGroup.members) || [];
    if (!percentageSection || !percentageInputsDiv) return;

    if (method === 'percentage') {
        percentageSection.style.display = 'block';
        percentageInputsDiv.innerHTML = '';
        members.forEach(member => {
            const inputHTML = `
                <div class="field is-horizontal">
                    <div class="field-label is-normal">
                        <label class="label">${member.name}</label>
                    </div>
                    <div class="field-body">
                        <div class="field has-addons">
                            <div class="control is-expanded">
                                <input class="input" type="number" placeholder="%" min="0" max="100">
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
    } else {
        percentageSection.style.display = 'none';
        percentageInputsDiv.innerHTML = '';
    }
}


/**
 * Llena el select de "Paid by" con los miembros del grupo.
 * @param {Array} members - Array de miembros.
 */
function populatePaidBySelect(members) {
    const paidBySelect = document.getElementById('expensePaidBy');
    if (!paidBySelect) return;
    paidBySelect.innerHTML = '';
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        paidBySelect.appendChild(option);
    });
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
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        select.appendChild(option);
    });
}

function populateMembersCheckboxes(members) {
    const container = document.getElementById('expenseMembersCheckboxes');
    if (!container) return;
    container.innerHTML = '';
    members.forEach(member => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${member.id}" checked>
            <span>${member.name}</span>
        `;
        container.appendChild(label);
    });
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
function addMemberToTags(name) {
    const memberTagsContainer = document.getElementById('memberTags');
    // prevent duplicates
    const existing = Array.from(document.querySelectorAll('#memberTags .tag'))
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
 * Handles the submission of the add payment form.
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
} catch (_) {}

// ========================================
// GROUP MEMBERS FETCHING & USAGE
// ========================================

/**
 * Obtiene los miembros del grupo desde el backend y actualiza el estado global.
 * @param {number} groupId - El ID del grupo.
 * @returns {Promise<Array>} - Array de miembros del grupo.
 */
async function fetchGroupMembers(groupId) {
    try {
        // Ajusta la URL si tu backend usa /api/expenses/group/:groupId/members
        const members = await apiFetch(`/expenses/group/${groupId}/members`);
        groupMembers = Array.isArray(members) ? members : [];
        return groupMembers;
    } catch (err) {
        showNotification('No se pudieron cargar los miembros del grupo', 'error');
        groupMembers = [];
        return [];
    }
}

/**
 * Llama a fetchGroupMembers y actualiza los selects del modal de gastos.
 * @param {number} groupId - El ID del grupo.
 */
async function prepareAddExpenseModal(groupId) {
    const members = await fetchGroupMembers(groupId);
    if (members.length < 1) {
        showNotification('No hay miembros en el grupo.', 'error');
        return;
    }
    populatePaidBySelect(members);
    populateMembersCheckboxes(members);
    handleSplitMethodChange();
}

/**
 * Muestra el modal de agregar gasto y prepara los selects con los miembros.
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
