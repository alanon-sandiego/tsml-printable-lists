# TSML Printable Meeting Lists Documentation

The 12 Step Meeting List plugin (TSML) plugin for WordPress is an amazing resource. Many thanks to all the contributors who created TSML and continue to support it. Hopefully this Printable Meeting List project adds value to it in some small way.

This project uses Google Sheets as a mechanism to generate a printable version of the meeting list. It uses the TSML plugin's Public Feed API to refresh the list in real time. Google Sheets offer a great deal of control over the content and format of the list. This solution works with any Google account, even a free Gmail account. Nothing else is required.

More information about the 12 Step Meeting List is available here: https://wordpress.org/support/plugin/12-step-meeting-list/

---

### **1\. Overview of the Solution**

This solution leverages the "Twelve Step Meeting List" (TSML) WordPress plugin's Public Feed feature to automatically import meeting data into a Google Sheet. Once imported, the data can be further processed or directly used for creating printable meeting lists.

**Components:**

* **WordPress Website with TSML Plugin:** Hosts the meeting data and generates the Public Feed.  
* **TSML Public Feed:** An API endpoint that provides meeting data in JSON format.  
* **Google Sheet:** The central repository where the meeting data is stored and managed.  
* **Google Apps Script (`ImportJSON.gs`):** A custom script within the Google Sheet that fetches and parses the JSON data from the Public Feed URL.  
* **Google Apps Script (`FormatTSML.gs`):** Contains utility functions, such as `FormatTypes`, which can be used to format specific data fields (e.g., converting type codes to names).

---

### **2\. Prerequisites**

To implement this solution, you will need:

* A WordPress website with the "Twelve Step Meeting List" plugin installed and configured with meeting data.  
* A Google account with access to Google Sheets and Google Apps Script.

---

### **3\. TSML Plugin Configuration (WordPress)**

1. **Access Feed Management:** In your WordPress dashboard, navigate to the TSML plugin settings.  
2. **Set Feed Sharing to "Open":** Ensure the "Feed Sharing" option is set to "Open". This makes your feeds publicly available without requiring a key or login.  
3. **Identify Public Data Source URL:** Locate the "Public Feed" section and click on the "Public Data Source" link. This URL provides the JSON data for your meetings. For Al-Anon San Diego the URL is `https://meetings.alanonsandiego.org/wp-admin/admin-ajax.php?action=meetings`. The data provided at this URL is in JSON format.  
   ![][image1]

---

### **4\. Google Sheet Setup**

#### **4.1. Create a New Google Sheet**

1. Start by creating a copy of this Google Sheet: [TSML Printable List Example for Github](https://docs.google.com/spreadsheets/d/1RU4QOCS9TTZU_o9LtH_Rsrdg_ZyDS-yrdmmh1NEzC3E/edit?gid=182692349#gid=182692349)

![][image2]

---

#### **4.3. Configure the Settings Sheet**

1. **Unhide the “Settings” Sheet.** Here’s how: [link](https://support.google.com/docs/answer/1218656?hl=en&co=GENIE.Platform%3DDesktop#zippy=%2Chide-or-unhide-a-sheet)  
   **![][image3]**
2. **Update the TSML Feed Url.** This is the web address located in cell B1. Use the web address you identified in Step 3\.  
   **![][image4]**

#### **4.5. How It Works**

* The hidden sheet ImportJSON contains the formula `=ImportJSON(Settings!B1)` at cell `A1.` This is the formula that imports the JSON data from the Url you entered in the previous step.  
* The custom function `ImportJSON` is located in the sheet’s Apps Script Extension, in a file named ImportJSON.gs. Do not modify this function unless you’re proficient programming in Google Apps Scripting language, which is an extended version of Javascript. More info on Google Apps Script here: [link](https://developers.google.com/apps-script/guides/sheets)  
* Google Sheets typically recalculates custom functions (like `ImportJSON`) approximately every **30 minutes**. There is no built-in way to manually override this recalculation interval.  
* The Full Meeting List sheet formats the data in the ImportJSON sheet into a printer-friendly format. Look at the formulas in row 2 of the Full Meeting List sheet to see how it’s done.  
* The District 72 Meetings sheet demonstrates how the Full Meeting List can be filtered as needed. See the QUERY formula in cell A2 for details.

---

### **5\. Understanding the Imported Data**

The `ImportJSON` script fetches the JSON data and flattens it into a two-dimensional array, with the first row serving as headers. Since no `query` parameter is provided in the formula, all fields from the JSON feed will be imported.

Based on the provided sample JSON data, you can expect fields similar to these to appear as columns in your `ImportJSON` sheet:

* `/id`  
* `/name`  
* `/slug`  
* `/notes`  
* `/updated`  
* `/location_id`  
* `/url`  
* `/day`  
* `/time`  
* `/time_formatted`  
* `/edit_url`  
* `/conference_url` (if applicable for online meetings)  
* `/conference_url_notes` (if applicable)  
* `/types` (meeting type codes, e.g., "ST", "X", "ONL")  
* `/author`  
* `/location`  
* `/location_url`  
* `/formatted_address`  
* `/approximate`  
* `/latitude`  
* `/longitude`  
* `/location_notes`  
* `/district`  
* `/sub_district`  
* `/zone`  
* `/group`  
* `/weekday`  
* `/month`  
* `/search`  
* `/duration`  
* `/group_id`  
* `/day_formatted`  
* `/start_time`  
* `/end_time`  
* `/timezone`  
* `/formats`  
* `/zone_id`  
* `/worldid`  
* `/region_id`  
* `/region`  
* `/regions`  
* `/attendance_option`  
* `/entity`  
* `/entity_email`  
* `/entity_url`  
* `/entity_phone`

The `ImportJSON` script also applies default transformations to headers (e.g., `/name` becomes `Name`, `/formatted_address` becomes `Formatted Address`) and truncates values longer than 256 characters.

---

### **6\. Basic Customization (Using `FormatTSML.gs`)**

The `FormatTSML.gs` script contains a `FormatTypes` function that is used to process the `types` column (which contains codes like "ST", "X", "ONL"). You can use this function in other cells or sheets to convert these codes into more readable names, assuming you have a `type_lookup` sheet as described in the `FormatTSML.gs` script comments.

For example, if cell `G2` in your `ImportJSON` sheet contains `ST,X`, you could use `=FormatTypes(ImportJSON!G2)` in another sheet to display "Step, Cross Talk" (or whatever your `type_lookup` sheet defines).

---

### **7\. Limitations and Considerations**

* **No Built-in Error Handling:** The current setup **does not include explicit error handling** if the "Public Data Source" URL becomes unavailable or if the JSON data format from the plugin changes unexpectedly. If such an event occurs, the `ImportJSON` formula may return an error in the sheet, and the data will not update. Developers should be aware of this limitation and consider implementing custom error logging or notification mechanisms if a more robust solution is required.  
* **Data Freshness:** The data is refreshed automatically approximately every 30 minutes. If more frequent updates are needed, a custom Apps Script trigger (e.g., time-driven trigger) could be set up, but this would require more advanced Apps Script development.  
* **Data Volume:** For very large meeting lists, the performance of `ImportJSON` and Google Sheets might be a consideration.
