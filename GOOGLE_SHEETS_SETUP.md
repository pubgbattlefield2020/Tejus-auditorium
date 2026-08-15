# 📊 Google Sheets Live Sync Setup Guide for Tejus Auditorium

Follow these simple 3-minute steps to link your Google Sheet with the Tejus Auditorium Booking System. Every booking created, edited, cancelled, or moved to trash will automatically sync to your Google Sheet in real-time!

---

## 🚀 Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a **Blank spreadsheet**.
2. Rename the spreadsheet to: **`Tejus Auditorium — Live Bookings`**.

---

## 📝 Step 2: Add the Google Apps Script

1. In your Google Sheet, click **Extensions** in the top menu and select **Apps Script**.
2. Delete any existing code in the editor, and **paste the following script completely**:

```javascript
/**
 * 🏛️ Tejus Auditorium — Live Booking Sync Webhook
 * Automatically handles Insert, Update, Cancellation, and Soft-Deletion (Trash)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. Initialize Headers if sheet is empty
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
      data.total_amount || 0,
      data.advance_amount || 0,
      data.pending_amount || 0,
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
      'Booking ID',
      'Receipt No',
      'Customer Name',
      'Mobile Phone',
      'Address / Place',
      'Event Date',
      'Timings',
      'Slot Period',
      'Programme Type',
      'Auditorium Area',
      'AC Option',
      'Waste Cleaning',
      'Referred By',
      'Total Amount (₹)',
      'Advance Paid (₹)',
      'Pending Balance (₹)',
      'Booking Status',
      'Booking Date',
      'Last Updated (IST)'
    ];

    sheet.appendRow(headers);

    // Format Header Row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1E3A8A'); // Dark Blue
    headerRange.setFontColor('#FFFFFF'); // White Text
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
}

function applyRowStyle(sheet, rowIndex, status) {
  var rowRange = sheet.getRange(rowIndex, 1, 1, 19);
  var statusCell = sheet.getRange(rowIndex, 17); // Column 17 is Booking Status

  if (status === 'Deleted (Trash)' || status === 'Permanently Deleted') {
    rowRange.setBackground('#FEE2E2'); // Soft red
    statusCell.setFontColor('#991B1B');
    statusCell.setFontWeight('bold');
  } else if (status === 'Cancelled') {
    rowRange.setBackground('#FEF3C7'); // Soft amber
    statusCell.setFontColor('#92400E');
    statusCell.setFontWeight('bold');
  } else if (status === 'Confirmed') {
    rowRange.setBackground('#FFFFFF');
    statusCell.setFontColor('#065F46'); // Green
    statusCell.setFontWeight('bold');
  } else {
    rowRange.setBackground('#FFFFFF');
    statusCell.setFontColor('#1E293B');
  }

  // Format currency columns (14, 15, 16)
  sheet.getRange(rowIndex, 14, 1, 3).setNumberFormat('₹ #,##0');
}
```

---

## 🌐 Step 3: Deploy as Web App

1. In the top-right of Apps Script editor, click **Deploy** ➔ **New deployment**.
2. Click the ⚙️ gear icon next to "Select type" and choose **Web app**.
3. Set the following settings:
   - **Description**: `Tejus Auditorium Booking Sync`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Crucial so Vercel can post updates)*
4. Click **Deploy**.
5. Copy the **Web App URL** (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 🔑 Step 4: Add URL to Vercel

1. Open your **Vercel Project Dashboard**.
2. Go to **Settings** ➔ **Environment Variables**.
3. Add a new variable:
   - **Key**: `NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL`
   - **Value**: *(Paste the Google Web App URL from Step 3)*
4. Click **Save** and **Redeploy**.

🎉 That's it! Every new booking, edit, cancellation, or trash action will now update your Google Sheet in real-time!
