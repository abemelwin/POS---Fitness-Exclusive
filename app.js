/**
 * =====================================================
 * POS APP - FITNESS EXCLUSIVE (Firebase Version)
 * Complete client-side logic with Firestore CRUD,
 * real-time listeners, auto-compute, and UI management
 * =====================================================
 */

// =====================================================
// GLOBAL STATE
// =====================================================
let itemsData = [];
let staffData = [];
let paymentTypes = ['Cash', 'Gcash'];
let priceMap = {};

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', async function() {
  setCurrentDate();
  setDefaultDates();
  await loadConfig();
  populateDropdowns();
  setupRealtimeListeners();
  loadDashboard();
});

function setCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('en-PH', options);
}

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  ['sale-date', 'stockin-date', 'col-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
}

// =====================================================
// NAVIGATION
// =====================================================
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (nav) nav.classList.add('active');

  const titles = { 'dashboard':'Dashboard','sales':'New Sale','stock-in':'Stock In','collections':'Collections','inventory':'Inventory','history':'Sales History','settings':'Settings' };
  document.getElementById('page-title').textContent = titles[page] || 'POS';

  if (page === 'dashboard') loadDashboard();
  if (page === 'inventory') loadInventory();
  if (page === 'history') loadSalesHistory();
  if (page === 'settings') loadSettings();
  closeSidebar();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) { overlay = document.createElement('div'); overlay.className = 'sidebar-overlay'; overlay.onclick = closeSidebar; document.body.appendChild(overlay); }
  overlay.classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.classList.remove('show');
}

// =====================================================
// CONFIG: Load Items, Staff, Payment Types from Firestore
// =====================================================
async function loadConfig() {
  try {
    const configDoc = await configRef.doc('settings').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      itemsData = data.items || [];
      staffData = data.staff || [];
      paymentTypes = data.paymentTypes || ['Cash', 'Gcash'];
    } else {
      // First time — create default config
      const defaults = {
        items: [
          { name: 'Mineral Water', price: 30 },
          { name: 'Pocari Sweat', price: 60 },
          { name: 'Gatorade', price: 60 },
          { name: 'Vita Milk', price: 75 }
        ],
        staff: ['Johnpaolo Napiza','Ahra Alandy','Gabriel Anjelo Cuizon','Jhudie Navarro','Elmar Diaz','Josephine Natividad','Jen Fernandez','Marc Maderazo Cotin','Julius Quepo','Lenny Candelon'],
        paymentTypes: ['Cash', 'Gcash'],
        branch: 'Trium Pasay',
        reorderLevel: 10
      };
      await configRef.doc('settings').set(defaults);
      itemsData = defaults.items;
      staffData = defaults.staff;
      paymentTypes = defaults.paymentTypes;
    }
    // Build price map
    priceMap = {};
    itemsData.forEach(item => { priceMap[item.name] = item.price; });
  } catch (err) {
    console.error('loadConfig error:', err);
    showToast('Error loading config: ' + err.message, 'error');
  }
}

function populateDropdowns() {
  populateSelect('sale-item', itemsData.map(i => i.name));
  populateSelect('sale-staff', staffData);
  populateSelect('sale-payment', paymentTypes);
  populateSelect('stockin-item', itemsData.map(i => i.name));
}

function populateSelect(id, options) {
  const select = document.getElementById(id);
  if (!select) return;
  const placeholder = select.options[0];
  select.innerHTML = '';
  select.appendChild(placeholder);
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt; o.textContent = opt;
    select.appendChild(o);
  });
}

// =====================================================
// REAL-TIME LISTENERS
// =====================================================
function setupRealtimeListeners() {
  // Listen to sales changes for dashboard
  salesRef.orderBy('createdAt', 'desc').limit(10).onSnapshot(snapshot => {
    updateRecentSales(snapshot.docs);
  });

  // Listen to inventory changes
  inventoryRef.onSnapshot(snapshot => {
    updateInventoryStatus(snapshot.docs);
  });
}

function updateRecentSales(docs) {
  const tbody = document.getElementById('recent-sales-body');
  if (docs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row">No sales yet</td></tr>';
    return;
  }
  tbody.innerHTML = docs.map(doc => {
    const s = doc.data();
    return `<tr>
      <td><strong>${s.invoiceNo || ''}</strong></td>
      <td>${s.customer || ''}</td>
      <td>${s.item || ''}</td>
      <td><strong>${formatCurrency(s.amount)}</strong></td>
      <td>${s.paymentType || ''}</td>
    </tr>`;
  }).join('');
}

function updateInventoryStatus(docs) {
  const tbody = document.getElementById('inventory-status-body');
  if (docs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="loading-row">No inventory data</td></tr>';
    return;
  }
  let totalStock = 0;
  tbody.innerHTML = docs.map(doc => {
    const inv = doc.data();
    totalStock += inv.currentStock || 0;
    return `<tr>
      <td>${inv.item || ''}</td>
      <td><strong>${inv.currentStock || 0}</strong></td>
      <td><span class="badge ${inv.status === 'OK' ? 'badge-ok' : 'badge-low'}">${inv.status || 'OK'}</span></td>
    </tr>`;
  }).join('');
  document.getElementById('dash-inventory').textContent = totalStock + ' units';
}

// =====================================================
// DASHBOARD
// =====================================================
async function loadDashboard() {
  try {
    // Total Sales
    const salesSnap = await salesRef.get();
    let totalSales = 0;
    salesSnap.forEach(doc => { totalSales += doc.data().amount || 0; });
    document.getElementById('dash-total-sales').textContent = formatCurrency(totalSales);

    // Total Collections & Outstanding
    const colSnap = await collectionsRef.get();
    let totalCollections = 0, outstanding = 0;
    colSnap.forEach(doc => {
      const d = doc.data();
      totalCollections += d.amountPaid || 0;
      outstanding += (d.amountDue || 0) - (d.amountPaid || 0);
    });
    document.getElementById('dash-total-collections').textContent = formatCurrency(totalCollections);
    document.getElementById('dash-outstanding').textContent = formatCurrency(outstanding);

    // Inventory
    const invSnap = await inventoryRef.get();
    let totalInv = 0;
    invSnap.forEach(doc => { totalInv += doc.data().currentStock || 0; });
    document.getElementById('dash-inventory').textContent = totalInv + ' units';
  } catch (err) {
    console.error('loadDashboard error:', err);
  }
}

// =====================================================
// SUBMIT SALE
// =====================================================
function onItemSelect() {
  const item = document.getElementById('sale-item').value;
  const priceField = document.getElementById('sale-price');
  if (item && priceMap[item]) {
    priceField.value = '₱ ' + Number(priceMap[item]).toFixed(2);
    computeAmount();
  } else {
    priceField.value = '';
    document.getElementById('sale-amount').value = '';
  }
}

function computeAmount() {
  const item = document.getElementById('sale-item').value;
  const qty = parseInt(document.getElementById('sale-qty').value) || 0;
  const price = priceMap[item] || 0;
  const amount = qty * price;
  document.getElementById('sale-amount').value = amount > 0 ? '₱ ' + amount.toFixed(2) : '';
}

async function submitSale(event) {
  event.preventDefault();
  const item = document.getElementById('sale-item').value;
  const qty = parseInt(document.getElementById('sale-qty').value) || 0;
  const price = priceMap[item] || 0;
  const amount = qty * price;

  const saleData = {
    staff: document.getElementById('sale-staff').value,
    customer: document.getElementById('sale-customer').value,
    item: item,
    qty: qty,
    unitPrice: price,
    amount: amount,
    paymentType: document.getElementById('sale-payment').value,
    date: document.getElementById('sale-date').value,
    branch: 'Trium Pasay',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!saleData.staff || !saleData.customer || !saleData.item || !saleData.qty || !saleData.paymentType) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  showLoading();
  try {
    // Generate invoice number
    const invoiceNo = await generateInvoiceNo();
    saleData.invoiceNo = invoiceNo;

    // Save sale
    await salesRef.add(saleData);

    // Update inventory
    await updateInventoryAfterSale(item, qty);

    hideLoading();
    document.getElementById('sales-form').style.display = 'none';
    document.getElementById('sale-success').style.display = 'block';
    document.getElementById('sale-success-detail').textContent = invoiceNo + ' | ' + item + ' x' + qty + ' = ' + formatCurrency(amount);
    showToast('Sale recorded: ' + invoiceNo, 'success');
    loadDashboard();
  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message, 'error');
    console.error(err);
  }
}

function newSaleAfterSuccess() {
  document.getElementById('sales-form').style.display = 'block';
  document.getElementById('sale-success').style.display = 'none';
  resetSaleForm();
}

function resetSaleForm() {
  document.getElementById('sales-form').reset();
  document.getElementById('sale-price').value = '';
  document.getElementById('sale-amount').value = '';
  setDefaultDates();
}

// =====================================================
// SUBMIT STOCK IN
// =====================================================
async function submitStockIn(event) {
  event.preventDefault();
  const stockData = {
    item: document.getElementById('stockin-item').value,
    qty: parseInt(document.getElementById('stockin-qty').value) || 0,
    supplier: document.getElementById('stockin-supplier').value || '',
    referenceNo: document.getElementById('stockin-ref').value || '',
    date: document.getElementById('stockin-date').value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!stockData.item || !stockData.qty) {
    showToast('Select item and enter quantity', 'error');
    return;
  }

  showLoading();
  try {
    await stockInRef.add(stockData);
    await updateInventoryAfterStockIn(stockData.item, stockData.qty);
    hideLoading();
    showToast('Stock added: ' + stockData.item + ' +' + stockData.qty, 'success');
    document.getElementById('stockin-form').reset();
    setDefaultDates();
    loadDashboard();
  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message, 'error');
  }
}

// =====================================================
// SUBMIT COLLECTION
// =====================================================
function computeBalance() {
  const due = parseFloat(document.getElementById('col-due').value) || 0;
  const paid = parseFloat(document.getElementById('col-paid').value) || 0;
  const balance = due - paid;
  document.getElementById('col-balance').value = balance >= 0 ? '₱ ' + balance.toFixed(2) : '₱ 0.00';
  document.getElementById('col-status').value = balance <= 0 ? 'PAID' : 'UNPAID';
}

async function submitCollection(event) {
  event.preventDefault();
  const due = parseFloat(document.getElementById('col-due').value) || 0;
  const paid = parseFloat(document.getElementById('col-paid').value) || 0;

  const colData = {
    customer: document.getElementById('col-customer').value,
    invoiceNo: document.getElementById('col-invoice').value || '',
    amountDue: due,
    amountPaid: paid,
    balance: due - paid,
    status: (due - paid) <= 0 ? 'PAID' : 'UNPAID',
    date: document.getElementById('col-date').value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!colData.customer || !colData.amountDue) {
    showToast('Fill in customer and amount due', 'error');
    return;
  }

  showLoading();
  try {
    await collectionsRef.add(colData);
    hideLoading();
    showToast('Collection recorded for ' + colData.customer, 'success');
    document.getElementById('collections-form').reset();
    document.getElementById('col-balance').value = '';
    document.getElementById('col-status').value = '';
    setDefaultDates();
    loadDashboard();
  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message, 'error');
  }
}

// =====================================================
// INVOICE GENERATION (Auto-increment)
// =====================================================
async function generateInvoiceNo() {
  const counterRef = configRef.doc('counter');
  
  return db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let currentNum = 0;
    if (counterDoc.exists) {
      currentNum = counterDoc.data().lastInvoice || 0;
    }
    const nextNum = currentNum + 1;
    transaction.set(counterRef, { lastInvoice: nextNum }, { merge: true });
    return 'INV-' + nextNum.toString().padStart(5, '0');
  });
}

// =====================================================
// INVENTORY AUTO-UPDATE
// =====================================================
async function updateInventoryAfterSale(itemName, qtySold) {
  const invDoc = inventoryRef.doc(itemName);
  const doc = await invDoc.get();
  const configDoc = await configRef.doc('settings').get();
  const reorderLevel = configDoc.exists ? (configDoc.data().reorderLevel || 10) : 10;

  if (doc.exists) {
    const data = doc.data();
    const newTotalSales = (data.totalSales || 0) + qtySold;
    const newCurrent = (data.beginningStock || 0) + (data.totalStockIn || 0) - newTotalSales;
    const status = newCurrent <= reorderLevel ? 'LOW STOCK' : 'OK';
    await invDoc.update({ totalSales: newTotalSales, currentStock: newCurrent, status: status });
  } else {
    const currentStock = -qtySold;
    const status = currentStock <= reorderLevel ? 'LOW STOCK' : 'OK';
    await invDoc.set({
      item: itemName, beginningStock: 0, totalStockIn: 0,
      totalSales: qtySold, currentStock: currentStock,
      reorderLevel: reorderLevel, status: status
    });
  }
}

async function updateInventoryAfterStockIn(itemName, qtyAdded) {
  const invDoc = inventoryRef.doc(itemName);
  const doc = await invDoc.get();
  const configDoc = await configRef.doc('settings').get();
  const reorderLevel = configDoc.exists ? (configDoc.data().reorderLevel || 10) : 10;

  if (doc.exists) {
    const data = doc.data();
    const newTotalStockIn = (data.totalStockIn || 0) + qtyAdded;
    const newCurrent = (data.beginningStock || 0) + newTotalStockIn - (data.totalSales || 0);
    const status = newCurrent <= reorderLevel ? 'LOW STOCK' : 'OK';
    await invDoc.update({ totalStockIn: newTotalStockIn, currentStock: newCurrent, status: status });
  } else {
    const currentStock = qtyAdded;
    const status = currentStock <= reorderLevel ? 'LOW STOCK' : 'OK';
    await invDoc.set({
      item: itemName, beginningStock: 0, totalStockIn: qtyAdded,
      totalSales: 0, currentStock: currentStock,
      reorderLevel: reorderLevel, status: status
    });
  }
}

// =====================================================
// INVENTORY PAGE
// =====================================================
async function loadInventory() {
  const tbody = document.getElementById('inventory-table-body');
  try {
    const snap = await inventoryRef.get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No inventory data</td></tr>';
      return;
    }
    tbody.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      return `<tr>
        <td><strong>${d.item || doc.id}</strong></td>
        <td>${d.beginningStock || 0}</td>
        <td>${d.totalStockIn || 0}</td>
        <td>${d.totalSales || 0}</td>
        <td><strong>${d.currentStock || 0}</strong></td>
        <td>${d.reorderLevel || 10}</td>
        <td><span class="badge ${d.status === 'OK' ? 'badge-ok' : 'badge-low'}">${d.status || 'OK'}</span></td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Error loading</td></tr>';
  }
}

// =====================================================
// SALES HISTORY PAGE
// =====================================================
async function loadSalesHistory() {
  const tbody = document.getElementById('history-table-body');
  try {
    const snap = await salesRef.orderBy('createdAt', 'desc').limit(100).get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-row">No sales history</td></tr>';
      return;
    }
    tbody.innerHTML = snap.docs.map(doc => {
      const s = doc.data();
      return `<tr>
        <td><strong>${s.invoiceNo || ''}</strong></td>
        <td>${s.date || ''}</td>
        <td>${s.staff || ''}</td>
        <td>${s.customer || ''}</td>
        <td>${s.item || ''}</td>
        <td>${s.qty || 0}</td>
        <td><strong>${formatCurrency(s.amount)}</strong></td>
        <td>${s.paymentType || ''}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Error loading</td></tr>';
  }
}

// =====================================================
// SETTINGS PAGE
// =====================================================
async function loadSettings() {
  // Items list
  const itemsContainer = document.getElementById('items-list-container');
  itemsContainer.innerHTML = itemsData.map((item, i) => `
    <div class="settings-item">
      <span>${item.name}</span>
      <span class="item-price">₱${item.price}</span>
      <button class="btn-delete" onclick="deleteItem(${i})"><span class="material-icons">delete</span></button>
    </div>
  `).join('');

  // Staff list
  const staffContainer = document.getElementById('staff-list-container');
  staffContainer.innerHTML = staffData.map((name, i) => `
    <div class="settings-item">
      <span>${name}</span>
      <button class="btn-delete" onclick="deleteStaff(${i})"><span class="material-icons">delete</span></button>
    </div>
  `).join('');

  // Beginning stock
  loadBeginningStock();
}

async function loadBeginningStock() {
  const container = document.getElementById('beginning-stock-container');
  const snap = await inventoryRef.get();
  if (snap.empty) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-light)">No inventory items yet. Add stock first.</p>';
    return;
  }
  container.innerHTML = snap.docs.map(doc => {
    const d = doc.data();
    return `<div class="settings-item">
      <span>${d.item || doc.id}</span>
      <input type="number" value="${d.beginningStock || 0}" style="width:80px;padding:6px;border:1px solid var(--border);border-radius:4px;" 
        onchange="updateBeginningStock('${doc.id}', this.value)">
    </div>`;
  }).join('');
}

async function updateBeginningStock(docId, value) {
  const qty = parseInt(value) || 0;
  const doc = await inventoryRef.doc(docId).get();
  if (doc.exists) {
    const data = doc.data();
    const newCurrent = qty + (data.totalStockIn || 0) - (data.totalSales || 0);
    const reorderLevel = data.reorderLevel || 10;
    const status = newCurrent <= reorderLevel ? 'LOW STOCK' : 'OK';
    await inventoryRef.doc(docId).update({ beginningStock: qty, currentStock: newCurrent, status: status });
    showToast('Beginning stock updated', 'success');
    loadDashboard();
  }
}

async function addItem() {
  const name = document.getElementById('new-item-name').value.trim();
  const price = parseFloat(document.getElementById('new-item-price').value) || 0;
  if (!name || !price) { showToast('Enter item name and price', 'error'); return; }

  itemsData.push({ name, price });
  priceMap[name] = price;
  await configRef.doc('settings').update({ items: itemsData });
  populateDropdowns();
  loadSettings();
  document.getElementById('new-item-name').value = '';
  document.getElementById('new-item-price').value = '';
  showToast('Item added: ' + name, 'success');
}

async function deleteItem(index) {
  itemsData.splice(index, 1);
  priceMap = {};
  itemsData.forEach(item => { priceMap[item.name] = item.price; });
  await configRef.doc('settings').update({ items: itemsData });
  populateDropdowns();
  loadSettings();
  showToast('Item deleted', 'success');
}

async function addStaff() {
  const name = document.getElementById('new-staff-name').value.trim();
  if (!name) { showToast('Enter staff name', 'error'); return; }

  staffData.push(name);
  await configRef.doc('settings').update({ staff: staffData });
  populateDropdowns();
  loadSettings();
  document.getElementById('new-staff-name').value = '';
  showToast('Staff added: ' + name, 'success');
}

async function deleteStaff(index) {
  staffData.splice(index, 1);
  await configRef.doc('settings').update({ staff: staffData });
  populateDropdowns();
  loadSettings();
  showToast('Staff deleted', 'success');
}

// =====================================================
// UTILITIES
// =====================================================
function formatCurrency(value) {
  return '₱ ' + (Number(value) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showLoading() { document.getElementById('loading-overlay').classList.add('show'); }
function hideLoading() { document.getElementById('loading-overlay').classList.remove('show'); }

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show';
  if (type) toast.classList.add('toast-' + type);
  setTimeout(() => { toast.classList.remove('show'); }, 4000);
}

function refreshData() {
  loadDashboard();
  loadConfig().then(() => populateDropdowns());
  showToast('Data refreshed!', 'success');
}
