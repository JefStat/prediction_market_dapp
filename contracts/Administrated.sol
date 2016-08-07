contract Administrated {
    event AdminAdded(address newAdmin);
    event AdminRemoved(address removedAdmin);

    mapping(address => bool) public isAdmin;
    uint adminCount;

    function Administrated() {
        _addAdmin(msg.sender);
    }

    modifier onlyAdmins() {
        if (!isAdmin[msg.sender]) throw;
        _
    }

    function _addAdmin(address newAdmin) private returns(bool success) {
        if (msg.value > 0) throw;
        if (isAdmin[newAdmin]) return false;
        isAdmin[newAdmin] = true;
        adminCount++;
        AdminAdded(newAdmin);
        return true;
    }

    function addAdmin(address newAdmin) onlyAdmins returns(bool success) {
        return _addAdmin(newAdmin);
    }

    function removeAdmin(address curAdmin) onlyAdmins returns(bool success) {
        if (msg.value > 0) throw;
        if (!isAdmin[curAdmin] || adminCount - 1 == 0) return false;
        isAdmin[curAdmin] = false;
        adminCount--;
        AdminRemoved(curAdmin);
        return true;
    }
}
