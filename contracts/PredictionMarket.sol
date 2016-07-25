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

contract PredictionMarket is Owned, Administrated {

    event PollClosed();
    event PollOpened();
    event PredictionUpdate(uint totalYes, uint totalNo);
    event PaidOut(address recipient, uint amount);

    event Debug(string message, address msgSender, uint aValue);

    struct Bet {
        uint yes;
        uint no;
        bool paidOut;
    }
    
    struct YesNoQuestion {
        string question; //should be a byte32 shortname for gas efficiency
        uint totalYes;
        uint totalNo;
        bool open;
        bool result; //true == yes, false == no
        uint closingDate;
        uint closingBalance;
        address trustedSource;
        mapping(address => Bet) bets;
    }

    YesNoQuestion public poll;
    
    function PredictionMarket() Owned() Administrated() {}
    
    function createNewPoll(
    string question
    ,address trustedSource
    ,uint closingDate
    ) private {
        poll = YesNoQuestion({
            question:question,
            totalYes: 0,
            totalNo: 0,
            open: true,
            result: false,
            closingDate: closingDate,
            closingBalance: 0,
            trustedSource: trustedSource
        });
    }
    
    modifier openPoll() {
        if (!poll.open) throw;
        _
    }
    
     modifier closedPoll() {
        if (poll.open) throw;
        _
    }
    
    modifier noMsgValue(){
        if (msg.value > 0) throw;
        _
    }
    
    function setNewTrustedSource(address trustedSource) onlyAdmins openPoll noMsgValue returns (bool success) {
        poll.trustedSource = trustedSource;
        return true;
    }
    
    function openNewPoll(string question, address trustedSource, uint closingDate) onlyAdmins closedPoll noMsgValue returns (bool success) {
        if (poll.closingDate > 0 ) throw; //contract can only be used for 1 poll
        createNewPoll(question, trustedSource, closingDate);
        PollOpened();
        return true;
    }
    
    function closePoll(bool result) openPoll noMsgValue returns (bool success) {
        if (poll.trustedSource == msg.sender
         || poll.closingDate < now) {
            poll.result = result;
            poll.open = false;
            poll.closingDate = now;
            poll.closingBalance = this.balance;
            PollClosed();
            return true;
        }
        throw;
    }
    
    function payOut() closedPoll noMsgValue returns (bool success) {
        if (poll.bets[recipient].paidOut) throw;
        poll.bets[recipient].paidOut = true;
        uint totalBets = poll.totalYes + poll.totalNo;

        address recipient = msg.sender;
        Bet bet = poll.bets[recipient];
        // Debug("bet yes", msg.sender, bet.yes);
        // Debug("bet no", msg.sender, bet.no);
        uint payout = ( poll.closingBalance *  (poll.result ? bet.yes : bet.no) )
                                        / totalBets;
        // Handle division and multiplication rounding errors.
        // Sucks a little bit to be the last person to collect
        if (payout > this.balance) {
            payout = this.balance;
        }
        
        if (!recipient.send(payout)) throw;

        PaidOut(recipient, payout);
        return true;
    }
    
    function betFor() openPoll returns (bool success) {
        if (msg.value == 0) throw; //no freebies!
        var value = msg.value;
        poll.totalYes += value;
        poll.bets[msg.sender].yes += value;
        PredictionUpdate(poll.totalYes, poll.totalNo);
        return true;
    }
    
    function betAgainst() openPoll returns (bool success) {
        if (msg.value == 0) throw; //no freebies!
        var value = msg.value;
        poll.totalNo += value;
        poll.bets[msg.sender].no += value;
        PredictionUpdate(poll.totalYes, poll.totalNo);
        return true;
    }
        
    //fallback function
    function () {
        throw;
    }

    function kill() onlyOwner closedPoll returns (bool success) {
        // should preferably:
        // - refund bets if poll is opened.
        // - owner collects if the poll has been closed for a long period of time
        selfdestruct(owner);
        return true;
    } 
}
