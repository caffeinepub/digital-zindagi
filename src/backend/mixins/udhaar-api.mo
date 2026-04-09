// mixins/udhaar-api.mo — Udhaar Book public-facing helper module
//
// These functions are called from main.mo public methods.
// State (Maps + counters) is owned by main.mo and passed in by reference.
//
// Toggle key 'dz_udhaar_enabled' is managed via the existing updateToggle /
// getAllToggles functions in main.mo — no new toggle code here.
//
import Types    "../types/udhaar";
import UdhaarLib "../lib/udhaar";
import Map      "mo:core/Map";

module {

  public type UdhaarCustomer    = Types.UdhaarCustomer;
  public type UdhaarTransaction = Types.UdhaarTransaction;

  // ── Customer endpoints ─────────────────────────────────────────────────────

  /// Add a new customer for providerId.
  /// Mutates: customers, nextCustomerId. Returns new customer id (Nat).
  public func addCustomer(
    customers      : Map.Map<Nat, UdhaarCustomer>,
    nextId         : var Nat,
    providerId     : Text,
    name           : Text,
    mobile         : Text,
    address        : Text,
  ) : Nat {
    let id = nextId;
    let c  = UdhaarLib.newCustomer(id, providerId, name, mobile, address);
    customers.add(id, c);
    nextId += 1;
    id;
  };

  /// Update name/mobile/address of an existing customer. Returns true on success.
  public func updateCustomer(
    customers : Map.Map<Nat, UdhaarCustomer>,
    id        : Nat,
    name      : Text,
    mobile    : Text,
    address   : Text,
  ) : Bool {
    switch (customers.get(id)) {
      case null { false };
      case (?c) {
        customers.add(id, { c with name; mobile; address });
        true;
      };
    };
  };

  /// Delete a customer and all its transactions. Returns true on success.
  public func deleteCustomer(
    customers    : Map.Map<Nat, UdhaarCustomer>,
    transactions : Map.Map<Nat, UdhaarTransaction>,
    id           : Nat,
  ) : Bool {
    if (not customers.containsKey(id)) { return false };
    customers.remove(id);
    UdhaarLib.deleteByCustomer(transactions, id);
    true;
  };

  /// Return all customers for providerId.
  public func getCustomers(
    customers  : Map.Map<Nat, UdhaarCustomer>,
    providerId : Text,
  ) : [UdhaarCustomer] {
    UdhaarLib.listByProvider(customers, providerId);
  };

  // ── Transaction endpoints ──────────────────────────────────────────────────

  /// Add a transaction for customerId. Returns new transaction id (Nat).
  public func addTransaction(
    transactions : Map.Map<Nat, UdhaarTransaction>,
    customers    : Map.Map<Nat, UdhaarCustomer>,
    nextId       : var Nat,
    customerId   : Nat,
    amount       : Float,
    txType       : Text,
    date         : Text,
    note         : Text,
  ) : ?Nat {
    if (not customers.containsKey(customerId)) { return null };
    let id = nextId;
    let t  = UdhaarLib.newTransaction(id, customerId, amount, txType, date, note);
    transactions.add(id, t);
    nextId += 1;
    ?id;
  };

  /// Mark a transaction as "paid". Returns true on success.
  public func markPaid(
    transactions : Map.Map<Nat, UdhaarTransaction>,
    id           : Nat,
  ) : Bool {
    switch (transactions.get(id)) {
      case null { false };
      case (?t) {
        transactions.add(id, { t with status = "paid" });
        true;
      };
    };
  };

  /// Delete a transaction. Returns true on success.
  public func deleteTransaction(
    transactions : Map.Map<Nat, UdhaarTransaction>,
    id           : Nat,
  ) : Bool {
    if (not transactions.containsKey(id)) { return false };
    transactions.remove(id);
    true;
  };

  /// Return all transactions for customerId, newest-first.
  public func getTransactions(
    transactions : Map.Map<Nat, UdhaarTransaction>,
    customerId   : Nat,
  ) : [UdhaarTransaction] {
    UdhaarLib.listByCustomer(transactions, customerId);
  };

};
