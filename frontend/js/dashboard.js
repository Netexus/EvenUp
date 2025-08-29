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
    }
    
    // Initial call to set up the group creation form
    handleCategoryChange();

    // Add event listener for expense split method
    const splitMethodRadios = document.getElementsByName('splitMethod');
    splitMethodRadios.forEach(radio => {
        radio.addEventListener('change', handleSplitMethodChange);
    });
});

/**
 * Helper and context 
 */
const API_BASE = '/api';
const authToken = () => localStorage.getItem('authToken') || '';
const currentUser = () => JSON.parse(localStorage.getItem('currentUser') || '{}');
const CURRENT_USER_ID = () => (currentUser()?.id || 1); // fallback 1 si hace falta

async function apiFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
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

// Helper to obtain the active group ID
function getActiveGroupId() {
  return Number(
    (window.currentGroup && (window.currentGroup.group_id ?? window.currentGroup.id)) || 0
  );
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
    document.getElementById('groupsSection').classList.add('is-hidden');
    document.getElementById('groupDetailsSection').classList.remove('is-hidden');
    
    // Populate group details
    document.getElementById('groupNameTitle').textContent = group.name;
    document.getElementById('groupDetailsAvatar').textContent = group.name.substring(0, 2).toUpperCase();
    document.getElementById('groupMembers').textContent = `${group.members.length} members`;
    document.getElementById('totalExpenses').textContent = `$${group.totalExpenses}`;
    document.getElementById('youOwe').textContent = `$${group.youOwe}`;
    document.getElementById('youAreOwed').textContent = `$${group.youAreOwed}`;
}

/**
 * Hides the group details view and shows the dashboard.
 */
function showDashboard() {
    document.getElementById('groupDetailsSection').classList.add('is-hidden');
    document.getElementById('groupsSection').classList.remove('is-hidden');
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
 * Shows the add payment modal and populates member lists.
 */
function showAddPaymentModal() {
    const modal = document.getElementById('addPaymentModal');
    if (modal) {
        populateMemberSelects('paymentFrom', currentGroup.members);
        populateMemberSelects('paymentTo', currentGroup.members);
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
function showAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        populateMemberSelects('expenseMembers', currentGroup.members);
        handleSplitMethodChange();
        modal.classList.add('is-active');
    }
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

// ========================================
// DYNAMIC FORM MANAGEMENT
// ========================================

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
    const method = document.querySelector('input[name="splitMethod"]:checked').value;
    const percentageSection = document.getElementById('percentageSplitSection');
    const percentageInputsDiv = document.getElementById('percentageInputs');
    
    if (method === 'percentage') {
        percentageSection.style.display = 'block';
        percentageInputsDiv.innerHTML = '';
        currentGroup.members.forEach(member => {
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
 * Populates a select dropdown with member options.
 * @param {string} selectId - The ID of the select element.
 * @param {object[]} members - An array of member objects.
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

// ========================================
// GROUP CREATION LOGIC
// ========================================

/**
 * Handles the creation of a new group.
 * Gathers form data, validates it, and simulates group creation.
 */
async function createGroup() {
  const groupName = document.getElementById('groupName').value.trim();
  const groupCategory = document.getElementById('groupCategory').value;
  const members = getMembers(); 

  if (!groupName) {
    showNotification('Group name is required.', 'error');
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

    // (POST of memberships)

    // Refresh UI:
    closeCreateGroupModal();
    showNotification(`Group "${created.group_name || groupName}" created!`, 'success');

    // Si ya tienes carga de grupos desde backend, vuelve a cargar:
    if (typeof loadGroupsFromApi === 'function') {
      loadGroupsFromApi();
    }
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
function addPayment() {
    const from = document.getElementById('paymentFrom').value;
    const to = document.getElementById('paymentTo').value;
    const amount = document.getElementById('paymentAmount').value;

    if (!from || !to || !amount) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    if (from === to) {
        showNotification('Cannot make a payment to yourself.', 'error');
        return;
    }

    // Simulate payment logic
    console.log(`Adding payment: ${from} paid $${amount} to ${to}`);
    showNotification('Payment added successfully!', 'success');
    closeAddPaymentModal();
}

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

    if (typeof reloadGroupDetails === 'function') {
      reloadGroupDetails(group_id);
    }
  } catch (err) {
    showNotification(err.message, 'error');
  }
}



// ========================================
// UTILITY FUNCTIONS (Reused from main.js)
// ========================================

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
