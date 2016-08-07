contract Owned {
    event OwnerChanged(address newOwner);
    address public owner;

    function Owned() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) throw;
        _
    }

    function changeOwner(address newOwner) onlyOwner {
        owner = newOwner;
        OwnerChanged(owner);
    }
}
