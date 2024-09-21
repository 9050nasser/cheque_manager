frappe.ui.form.on('Payment Entry', {

    is_cheque(frm) {
        if (frm.doc.is_cheque == 1 && frm.doc.payment_type == 'Receive') {
            frm.set_value('mode_of_payment', 'شيكات واردة')
        }
        if (frm.doc.is_cheque == 1 && frm.doc.payment_type == 'Pay') {
            frm.set_value('mode_of_payment', 'شيكات صادرة')
        }
    },

    refresh(frm) {
        if (frm.doc.payment_type == "Receive" && frm.doc.docstatus == 1 && frm.doc.is_cheque == 1) {
            add_under_collection_button(frm);
            add_endore_button(frm);
        }


        if (frm.doc.under_collection == 1) {
            update_buttons_for_under_collection(frm);
        }
        if (frm.doc.status == 'Refused') {
            frm.remove_custom_button("Under Collection", "Actions");
            frm.remove_custom_button("Endore", "Actions");
        }

        if (frm.doc.status == 'Bounced') {
            frm.remove_custom_button("Bounced", "Actions");
            frm.remove_custom_button("Collect", "Actions");
            frm.add_custom_button(__("Redeposit"), function () {
                frappe.prompt([{
                    label: 'Choose Account',
                    fieldname: 'bank_account',
                    fieldtype: 'Link',
                    options: 'Account',
                    // get_query() {
                    //     return {
                    //         "filters": [
                    //             ["Account", "account_type", "=", "Bank"],
                    //         ]
                    //     };
                    // },
                },
                {
                    label: 'Choose Date',
                    fieldname: 'date',
                    fieldtype: 'Date'
                }
                ], (values) => {
                    frappe.call({
                        method: 'cheque_manager.api.make_gl',
                        args: {
                            'posting_date': values.date || frm.doc.posting_date, // Use selected date or fallback to the document's date
                            'paid_to': frm.doc.paid_to,
                            'cost_center': frm.doc.cost_center,
                            'paid_amount': frm.doc.paid_amount,
                            'against': values.bank_account,
                            'voucher_type': frm.doc.doctype,
                            'voucher_no': frm.doc.name
                        },
                        callback: function (r) {
                            if (!r.exc) {
                                frappe.msgprint("Redeposit Done");
                                frm.set_value('under_collection', 1);
                                frm.set_value('custom_under_collection_account', values.bank_account);
                                frm.set_value('status', "Redeposit");
                                var childTable = frm.add_child("custom_cheque_status");
                                childTable.status = "Redeposit"
                                childTable.date = values.date
                                frm.refresh_fields("custom_cheque_status");
                                frm.save("Update");
                            }
                        }
                    });
                });
            }, __("Actions"));

            frm.add_custom_button(__("Refused"), function () {
                frappe.prompt(
                    {
                        label: 'Choose Date',
                        fieldname: 'date',
                        fieldtype: 'Date'
                    }
                    , (values) => {
                        frappe.call({
                            method: 'cheque_manager.api.make_gl',
                            args: {
                                'posting_date': values.date || frm.doc.posting_date,
                                'paid_to': 'أوراق قبض - Impact',
                                'cost_center': frm.doc.cost_center,
                                'paid_amount': frm.doc.paid_amount,
                                'against': frm.doc.paid_from,
                                'voucher_type': frm.doc.doctype,
                                'voucher_no': frm.doc.name,
                                'party_type': frm.doc.party_type,
                                'party': frm.doc.party
                            },
                            callback: function (r) {
                                if (!r.exc) {
                                    frappe.msgprint("Refused Done");
                                    frm.set_value('under_collection', 0);
                                    frm.set_value('status', "Refused");
                                    var childTable = frm.add_child("custom_cheque_status");
                                    childTable.status = "Refused"
                                    childTable.date = values.date
                                    frm.refresh_fields("custom_cheque_status");
                                    frm.save("Update");
                                }
                            }
                        });
                    })
            }, __("Actions"));
        }

        if (frm.doc.collected == 1) {
            frm.remove_custom_button("Collect", "Actions");
            frm.remove_custom_button("Bounced", "Actions");
        }

        if (frm.doc.payment_type == 'Pay' && frm.doc.docstatus == 1 && frm.doc.status != "Funding") {
            add_pay_button(frm);
        }

        if (frm.doc.status == 'Paid') {
            frm.remove_custom_button("Pay", "Actions");
        }
        if (frm.doc.status == 'Paid' && (frm.doc.party_type == 'Employee' || frm.doc.party_type == 'Shareholder')) {
            //         frm.add_custom_button(__("Treasury Funding"), function () {
            //     frappe.prompt({
            //         label: 'Choose Cash Account',
            //         fieldname: 'bank_account',
            //         fieldtype: 'Link',
            //         options: 'Account',
            //         get_query() {
            //             return {
            //                 "filters": [
            //                     ["Account", "account_type", "=", "Cash"],
            //                 ]
            //             };
            //         },
            //     }, (values) => {
            //         frappe.call({
            //             method: 'cheque_manager.api.make_gl',
            //             args: {
            //                 'posting_date': frm.doc.posting_date,
            //                 'paid_to': frm.doc.paid_to,
            //                 'cost_center': frm.doc.cost_center,
            //                 'paid_amount': frm.doc.paid_amount,
            //                 'against': values.bank_account,
            //                 'voucher_type': frm.doc.doctype,
            //                 'voucher_no': frm.doc.name
            //             },
            //             callback: function (r) {
            //                 if (!r.exc) {
            //                     frappe.msgprint("Funding Done");
            //                     frm.set_value('collected', 1);
            //                     frm.set_value('status', "Funding");
            //                     frm.set_value('custom_bank_name', values.bank_account);
            //                     frm.save("Update");
            //                 }
            //             }
            //         });
            //     });
            // }, __("Actions"));
        }
        if (frm.doc.payment_type == 'Internal Transfer' && frm.doc.docstatus == 1 && frm.doc.pay_with_cheque == 1) {
            transfer(frm);
        }
    },
    pay_with_cheque(frm) {
        frm.set_value('paid_to', 'أوراق دفع - Impact');
        frm.set_query("mode_of_payment", function () {
            return {
                "filters": [
                    ["Mode of Payment", "type", "=", "Bank"]
                ]
            };
        });
    }
});

function transfer(frm) {
    frm.add_custom_button(__("Transfer"), function () {
        frappe.prompt([{
            label: 'Choose Account',
            fieldname: 'bank_account',
            fieldtype: 'Link',
            options: 'Account',
            get_query() {
                return {
                    "filters": [
                        ["Account", "account_type", "=", "Cash"],
                    ]
                };
            },

        },
        {
            label: 'Choose Date',
            fieldname: 'date',
            fieldtype: 'Date'
        }]
            , (values) => {
                frappe.call({
                    method: 'cheque_manager.api.make_gl',
                    args: {
                        'posting_date': values.date,
                        'paid_to': frm.doc.paid_to,
                        'cost_center': frm.doc.cost_center,
                        'paid_amount': frm.doc.paid_amount,
                        'against': values.bank_account,
                        'voucher_type': frm.doc.doctype,
                        'voucher_no': frm.doc.name
                    },
                    callback: function (r) {
                        if (!r.exc) {
                            frappe.msgprint("Transfer Done");
                            frm.set_value('transferred', 1);
                            frm.set_value('status', "Transferred");
                            frm.set_value('custom_bank_name', values.bank_account);
                            var childTable = frm.add_child("custom_cheque_status");
                            childTable.status = "Transferred"
                            childTable.date = values.date
                            frm.refresh_fields("custom_cheque_status");
                            frm.save("Update");
                        }
                    }
                });
            });
    }, __("Actions"));
}

function add_under_collection_button(frm) {
    frm.add_custom_button(__("Under Collection"), function () {
        frappe.prompt([{
            label: 'Choose Account',
            fieldname: 'bank_account',
            fieldtype: 'Link',
            options: 'Account',
            // get_query() {
            //     return {
            //         "filters": [
            //             ["Account", "account_type", "=", "Bank"],
            //         ]
            //     };
            // },
        },
        {
            label: 'Choose Date',
            fieldname: 'date',
            fieldtype: 'Date'
        }
        ], (values) => {
            frappe.call({
                method: 'cheque_manager.api.make_gl',
                args: {
                    'posting_date': values.date || frm.doc.posting_date, // Use selected date or fallback to the document's date
                    'paid_to': frm.doc.paid_to,
                    'cost_center': frm.doc.cost_center,
                    'paid_amount': frm.doc.paid_amount,
                    'against': values.bank_account,
                    'voucher_type': frm.doc.doctype,
                    'voucher_no': frm.doc.name
                },
                callback: function (r) {
                    if (!r.exc) {
                        frappe.msgprint("Under Collection Done");
                        frm.set_value('under_collection', 1);
                        frm.set_value('custom_under_collection_account', values.bank_account);
                        frm.set_value('status', "Under Collection");
                        var childTable = frm.add_child("custom_cheque_status");
                        childTable.status = "Under Collection"
                        childTable.date = values.date
                        frm.refresh_fields("custom_cheque_status");
                        frm.save("Update");
                    }
                }
            });
        });
    }, __("Actions"));
}


function add_endore_button(frm) {
    frm.add_custom_button(__("Endore"), function () {
        frm.set_value('status', "Endore");
        frm.save("Update");
    }, __("Actions"));
}

function update_buttons_for_under_collection(frm) {
    frm.remove_custom_button("Under Collection", "Actions");
    frm.remove_custom_button("Endore", "Actions");

    frm.add_custom_button(__("Collect"), function () {
        frappe.prompt([{
            label: 'Choose Bank Account',
            fieldname: 'bank_account',
            fieldtype: 'Link',
            options: 'Account',
            get_query() {
                return {
                    "filters": [
                        ["Account", "account_type", "=", "Bank"],
                    ]
                };
            },
        },
        {
            label: 'Choose Date',
            fieldname: 'date',
            fieldtype: 'Date'
        }], (values) => {
            frappe.call({
                method: 'cheque_manager.api.make_gl',
                args: {
                    'posting_date': values.date,
                    'paid_to': frm.doc.custom_under_collection_account,
                    'cost_center': frm.doc.cost_center,
                    'paid_amount': frm.doc.paid_amount,
                    'against': values.bank_account,
                    'voucher_type': frm.doc.doctype,
                    'voucher_no': frm.doc.name
                },
                callback: function (r) {
                    if (!r.exc) {
                        frappe.msgprint("Collection Done");
                        frm.set_value('collected', 1);
                        frm.set_value('status', "Collected");
                        frm.set_value('custom_bank_name', values.bank_account);
                        var childTable = frm.add_child("custom_cheque_status");
                        childTable.status = "Collected"
                        childTable.date = values.date
                        frm.refresh_fields("custom_cheque_status");
                        frm.save("Update");
                    }
                }
            });
        });
    }, __("Actions"));

    frm.add_custom_button(__("Bounced"), function () {
        frappe.prompt(
            {
                label: 'Choose Date',
                fieldname: 'date',
                fieldtype: 'Date',
            }
            , (values) => {
                frappe.call({
                    method: 'cheque_manager.api.make_gl',
                    args: {
                        'posting_date': values.date || frm.doc.posting_date,
                        'paid_to': frm.doc.custom_under_collection_account,
                        'cost_center': frm.doc.cost_center,
                        'paid_amount': frm.doc.paid_amount,
                        'against': frm.doc.paid_to,
                        'voucher_type': frm.doc.doctype,
                        'voucher_no': frm.doc.name
                    },
                    callback: function (r) {
                        if (!r.exc) {
                            frappe.msgprint("Bounced Done");
                            frm.set_value('bounced', 1);
                            frm.set_value('status', "Bounced");
                            var childTable = frm.add_child("custom_cheque_status");
                            childTable.status = "Bounced"
                            childTable.date = values.date
                            frm.refresh_fields("custom_cheque_status");
                            frm.save("Update");
                        }
                    }
                })
            });
    }, __("Actions"));
}

function add_pay_button(frm) {
    frm.add_custom_button(__("Pay"), function () {
        frappe.prompt([{
            label: 'Choose Bank Account',
            fieldname: 'bank_account',
            fieldtype: 'Link',
            options: 'Account',
            get_query() {
                return {
                    "filters": [
                        ["Account", "account_type", "=", "Bank"],
                    ]
                };
            },

        },
        {
            label: 'Choose Date',
            fieldname: 'date',
            fieldtype: 'Date',
        }
        ], (values) => {
            frappe.call({
                method: 'cheque_manager.api.make_gl',
                args: {
                    'posting_date': values.date || frm.doc.posting_date,
                    'paid_to': values.bank_account,
                    'cost_center': frm.doc.cost_center,
                    'paid_amount': frm.doc.paid_amount,
                    'against': frm.doc.paid_from,
                    'voucher_type': frm.doc.doctype,
                    'voucher_no': frm.doc.name
                },
                callback: function (r) {
                    if (!r.exc) {
                        frappe.msgprint("Paid Done");
                        frm.set_value('paid', 1);
                        frm.set_value('status', "Paid");
                        frm.set_value('custom_bank_name', values.bank_account);
                        var childTable = frm.add_child("custom_cheque_status");
                        childTable.status = "Paid"
                        childTable.date = values.date
                        frm.refresh_fields("custom_cheque_status");
                        frm.save("Update");
                    }
                }
            });
        });
    }, __("Actions"));
}
