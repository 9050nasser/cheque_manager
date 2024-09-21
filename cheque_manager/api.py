import frappe
from frappe import _
@frappe.whitelist()
def make_gl(posting_date, paid_to, paid_amount, against, voucher_type, voucher_no, party_type=None, party=None, cost_center=None):
    gl = frappe.new_doc("GL Entry")
    gl.posting_date = posting_date
    gl.account = paid_to
    if cost_center:
        gl.cost_center = cost_center
    if party:
        gl.party_type = party_type
        gl.party = party
    gl.credit = paid_amount
    gl.against = against
    gl.voucher_type = voucher_type
    gl.voucher_no = voucher_no
    gl.insert(ignore_permissions=True)
    gl.submit()
    gl = frappe.new_doc("GL Entry")
    gl.posting_date = posting_date
    gl.account = against
    if cost_center:
        gl.cost_center = cost_center
    if party:
        gl.party_type = party_type
        gl.party = party
    gl.debit = paid_amount
    gl.against = paid_to
    gl.voucher_type = voucher_type
    gl.voucher_no = voucher_no
    gl.insert(ignore_permissions=True)
    gl.submit()

@frappe.whitelist()
def cheque_status(voucher):
    document = frappe.get_doc("Payment Entry", voucher)
    childtable = document.custom_cheque_status
    if len(childtable) < 1:
        return 0
    else:
        html = """
                <table class="table table-striped">
                <thead>
                    <tr>
                    <th scope="col">#</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                    </tr>
                </thead>
                <tbody>
        """
        for table in childtable:
            html += f"""
                    <tr>
                    <th scope="row">{_(table.idx)}</th>
                    <td>{_(table.status)}</td>
                    <td>{_(table.date)}</td>
                    </tr>
            """

        html += """
                </tbody>
                </table>
        """

        return html

