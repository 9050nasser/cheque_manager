# Copyright (c) 2024, Mohammed Nasser and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.query_builder.functions import Date
from datetime import datetime
from datetime import datetime, timedelta

Filters = frappe._dict

def execute(filters: Filters = None) -> tuple:
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns() -> list[dict]:
    return [
        {"label": _("Date"), "fieldname": "posting_date", "fieldtype": "Data"},
        {"label": _("Cheque Type"), "fieldname": "cheque_type", "fieldtype": "Data"},
        {"label": _("Bank Name"), "fieldname": "bank_name", "fieldtype": "Link", "options":"Account", "width":200},
        {"label": _("Beneficiary Name"), "fieldname": "beneficiary_name", "fieldtype": "Data", "width":200},
        {"label": _("Status"), "fieldname": "status", "fieldtype": "Data", "width":150},
        {"label": _("Cheque No."), "fieldname": "cheque_no", "fieldtype": "Data", "width":150},
        {"label": _("Due Date"), "fieldname": "due_date", "fieldtype": "Data", "width":150},
        {"label": _("Voucher No."), "fieldname": "voucher_no", "fieldtype": "Link", "options":"Payment Entry", "width":200},
        {"label": _("Paid Amount"), "fieldname": "paid_amount", "fieldtype": "Currency", "width":200},
        {"label": _("History"), "fieldname": "button", "fieldtype": "Data", "width":200},
    ]

def get_data(filters: Filters) -> list[dict]:
    
    conditions = []
    if filters.get("company"):
        conditions.append(f"pe.company = '{filters.get('company')}'")
    if filters.get("from_date"):
        conditions.append(f"pe.posting_date >= '{filters.get('from_date')}'")
    if filters.get("to_date"):
        conditions.append(f"pe.posting_date <= '{filters.get('to_date')}'")
    if filters.get("cheque_type"):
        cheque_type_list = filters.get("cheque_type")
        if len(cheque_type_list) == 1:
            cheque_type = cheque_type_list[0]
            conditions.append(f"pe.mode_of_payment = '{cheque_type}'")
        else:
            cheque_type = tuple(cheque_type_list)
            conditions.append(f"pe.mode_of_payment IN {cheque_type}")
    if filters.get("bank_name"):
        bank_name_list = filters.get("bank_name")
        if len(bank_name_list) == 1:
            bank_name = bank_name_list[0]
            conditions.append(f"pe.custom_bank_name = '{bank_name}'")
        else:
            bank_name = tuple(bank_name_list)
            conditions.append(f"pe.custom_bank_name IN {bank_name}")
    if filters.get("beneficiary_name"):
        conditions.append(f"pe.party LIKE '%{filters.get('beneficiary_name')}%'")
    if filters.get("status"):
        conditions.append(f"pe.status = '{filters.get('status')}'")
    if filters.get("cheque_no"):
        conditions.append(f"pe.reference_no LIKE '%{filters.get('cheque_no')}%'")
    if filters.get("due_date_from") and filters.get("due_date_to"):
        conditions.append(f"pe.reference_date BETWEEN '{filters.get('due_date_from')}' AND '{filters.get('due_date_to')}'")
    condition_str = " AND ".join(conditions)
    if condition_str:
        condition_str = "AND " + condition_str

    sql = frappe.db.sql(f"""
        SELECT 
        pe.posting_date as posting_date,
        pe.mode_of_payment as mode_of_payment,
        pe.custom_bank_name as bank_name,
        pe.party as party,
        pe.status as status,
        pe.reference_no as reference_no,
        pe.reference_date as reference_date,
        pe.name as name,
        pe.paid_amount as paid_amount
        FROM `tabPayment Entry` pe
        WHERE pe.docstatus=1 AND pe.is_cheque=1 {condition_str}
        ORDER BY pe.posting_date ASC, pe.name ASC, pe.reference_date ASC
        """, as_dict=True)
    response = []
    for row in sql:
        response.append({
            "posting_date": row.posting_date,
            "cheque_type": row.mode_of_payment,
            "bank_name": row.bank_name,
            "beneficiary_name": row.party,
            "status": row.status,
            "cheque_no": row.reference_no,
            "due_date": row.reference_date,
            "voucher_no": row.name,
            "paid_amount": row.paid_amount,
            "button": row.name
        })
        
    return response
