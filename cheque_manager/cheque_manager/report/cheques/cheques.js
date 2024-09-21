// Copyright (c) 2024, Mohammed Nasser and contributors
// For license information, please see license.txt

frappe.query_reports["Cheques"] = {
	filters: [

		{
			label: __("Company"),
			fieldname: "company",
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_user_default("Company"),
		},
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			reqd: 1,
			default: frappe.defaults.get_default("year_start_date"),
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			reqd: 1,
			default: frappe.defaults.get_default("year_end_date"),
		},
		{
			fieldname: "cheque_type",
			label: __("Cheque Type"),
			fieldtype: "MultiSelectList",
			options: "Mode of Payment",
			get_data: function (txt) {
				return frappe.db.get_link_options("Mode of Payment", txt, {
					type: "Bank",
					custom_is_cheque: 1
				});
			},
		},
		{
			fieldname: "bank_name",
			label: __("Bank Name"),
			fieldtype: "MultiSelectList",
			options: "Account",
			get_data: function (txt) {
				return frappe.db.get_link_options("Account", txt, {
					account_type: "Bank",
					is_group: 0
				});
			},
		},
		{
			fieldname: "beneficiary_name",
			label: __("Beneficiary Name"),
			fieldtype: "Data",
		},
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "Select",
			options: [
				"",
				{
					"label": __("Draft"),
					"value": "Draft"
				},
				{
					"label": __("Submitted"),
					"value": "Submitted"
				},
				{
					"label": __("Cancelled"),
					"value": "Cancelled"
				},
				{
					"label": __("In Cheque Treasury"),
					"value": "In Cheque Treasury"
				},
				{
					"label": __("Bounced"),
					"value": "Bounced"
				},
				{
					"label": __("Collected"),
					"value": "Collected"
				},
				{
					"label": __("Under Collection"),
					"value": "Under Collection"
				},
				{
					"label": __("Endore"),
					"value": "Endore"
				},
				{
					"label": __("Paid"),
					"value": "Paid"
				},
				{
					"label": __("Transferred"),
					"value": "Transferred"
				},
				{
					"label": __("Recollected"),
					"value": "Recollected"
				},
				{
					"label": __("Refused"),
					"value": "Refused"
				},
				{
					"label": __("Funding"),
					"value": "Funding"
				}
			],
		},
		{
			fieldname: "cheque_no",
			label: __("Cheque No"),
			fieldtype: "Data",
		},
		{
			fieldname: "due_date_from",
			label: __("Due Date From"),
			fieldtype: "Date",
		},
		{
			fieldname: "due_date_to",
			label: __("Due Date To"),
			fieldtype: "Date",
		},
	],

	formatter(value, row, column, data, default_formatter) {
		// Show a button instead of the "name"
		if (column.fieldname == "button") {
			const button_html = `<button id="history-btn-${value}" class="btn btn-default btn-xs" onclick="frappe.query_reports['Cheques'].history('${value}')">History</button>`;
			value = button_html;
		}
		return default_formatter(value, row, column, data);
	},

	history(name) {
		frappe.call({
			method: 'cheque_manager.api.cheque_status',
			args: {
				'voucher': name,
			},
			callback: function (r) {
				if (!r.exc) {
					if (r.message) {
						frappe.msgprint({
							title: __('Cheque Status'),
							indicator: 'green',
							message: r.message
						});
					}
					if (r.message === 0) {
						// Remove the button if r.message is 0
						frappe.msgprint({
							title: __('Cheque Status'),
							indicator: 'red',
							message: "No History Found for this Cheque"
						});
					}
				}
			}
		});
	},


};
