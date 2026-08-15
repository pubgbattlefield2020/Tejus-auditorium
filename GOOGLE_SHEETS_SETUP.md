# 📊 Google Sheets Live Sync Setup Guide for Tejus Auditorium

Follow these simple steps to ensure your Google Sheet receives live booking updates from Tejus Auditorium.

---

## 🔑 Crucial Step: Authorize Google Apps Script

Google requires you to grant permission once so the script can write to your Google Sheet:

1. Open your **Google Sheet** (e.g. `Tejus Auditorium — Live Bookings`).
2. Click **Extensions** ➔ **Apps Script**.
3. Replace the entire code with the updated script below:

```javascript
/**
 * 🏛️ Tejus Auditorium — Live Booking Sync Webhook
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. Initialize Headers if empty
    initHeaders(sheet);

    var bookingId = String(data.booking_id || '').trim();
    if (!bookingId) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No booking_id provided' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var rowValues = [
      data.booking_id || '',
      data.receipt_no || '',
      data.customer_name || '',
      data.customer_phone || '',
      data.customer_address || '',
      data.programme_date || '',
      data.timings || '',
      data.slot_period || '',
      data.programme_type || '',
      data.auditorium_area || '',
      data.ac_type || '',
      data.waste_cleaning || '',
      data.referred_by || '',
      Number(data.total_amount || 0),
      Number(data.advance_amount || 0),
      Number(data.pending_amount || 0),
      data.status || 'Confirmed',
      data.booking_date || '',
      data.last_updated_ist || ''
    ];

    // 2. Search for existing row with matching Booking ID (Column A)
    var lastRow = sheet.getLastRow();
    var existingRowIndex = -1;

    if (lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === bookingId) {
          existingRowIndex = i + 2; // 1-based index (Header is row 1)
          break;
        }
      }
    }

    if (existingRowIndex > 0) {
      // Update existing row
      sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      applyRowStyle(sheet, existingRowIndex, data.status);
    } else {
      // Append new row
      sheet.appendRow(rowValues);
      var newRowIndex = sheet.getLastRow();
      applyRowStyle(sheet, newRowIndex, data.status);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', booking_id: bookingId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function initHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = [
      'Booking ID', 'Receipt No', 'Customer Name', 'Mobile Phone', 'Address / Place',
      'Event Date', 'Timings', 'Slot Period', 'Programme Type', 'Auditorium Area',
      'AC Option', 'Waste Cleaning', 'Referred By', 'Total Amount (₹)', 'Advance Paid (₹)',
      'Pending Balance (₹)', 'Booking Status', 'Booking Date', 'Last Updated (IST)'
    ];

    sheet.appendRow(headers);

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1E3A8A');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
}

function applyRowStyle(sheet, rowIndex, status) {
  var rowRange = sheet.getRange(rowIndex, 1, 1, 19);
  var statusCell = sheet.getRange(rowIndex, 17);

  if (status === 'Deleted (Trash)' || status === 'Permanently Deleted') {
    rowRange.setBackground('#FEE2E2');
    statusCell.setFontColor('#991B1B');
    statusCell.setFontWeight('bold');
  } else if (status === 'Cancelled') {
    rowRange.setBackground('#FEF3C7');
    statusCell.setFontColor('#92400E');
    statusCell.setFontWeight('bold');
  } else if (status === 'Confirmed') {
    rowRange.setBackground('#FFFFFF');
    statusCell.setFontColor('#065F46');
    statusCell.setFontWeight('bold');
  }
  sheet.getRange(rowIndex, 14, 1, 3).setNumberFormat('₹ #,##0');
}

/**
 * 🧪 Test & Authorize function (Run this once in Apps Script to grant permissions!)
 */
function testSync() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  initHeaders(sheet);
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        booking_id: 'TA-TEST-001',
        receipt_no: 'RC-TEST-001',
        customer_name: 'Test Customer',
        customer_phone: '9447241559',
        customer_address: 'Kochi',
        programme_date: '2026-08-20',
        timings: '9:00 AM – 1:00 PM',
        slot_period: 'Morning',
        programme_type: 'Wedding Reception',
        auditorium_area: 'Full Auditorium',
        ac_type: 'AC',
        waste_cleaning: 'Yes',
        referred_by: 'Self',
        total_amount: 25000,
        advance_amount: 5000,
        pending_amount: 20000,
        status: 'Confirmed',
        booking_date: '2026-08-16',
        last_updated_ist: new Date().toLocaleString()
      })
    }
  };
  doPost(mockEvent);
}
```

---

## ⚡ How to Authorize & Test (1 Click):

1. In the Apps Script toolbar, make sure **`testSync`** is selected in the function dropdown (next to *Debug*).
2. Click **Run** ▶️.
3. Google will show **"Authorization required"**:
   - Click **Review permissions**.
   - Choose your Google account.
   - Click **Advanced** ➔ **Go to Untitled project (unsafe)**.
   - Click **Allow**.
4. Check your Google Sheet: The **Blue Header Row** and a test row will immediately appear! (You can delete the test row).

---

## 🌐 Deploy as Web App

1. Click **Deploy** ➔ **Manage deployments** (or **New deployment**).
2. Click ✏️ **Edit** (or create new version).
3. Set **Who has access** to **`Anyone`**.
4. Click **Deploy** and copy your Web App URL.
5. In **Vercel Project Settings > Environment Variables**, ensure:
   - `NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL` = *(Your Web App URL)*
6. In your live admin panel, click **Google Sheets** in the header to sync all bookings!
