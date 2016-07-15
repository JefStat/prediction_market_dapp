contract Owned {
    event OwnerChanged(address newOwner);
    address owner;

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
    
    mapping(address => bool) isAdmin;
    
    function Administrated() {
        isAdmin[msg.sender] = true;
    }
    
    modifier onlyAdmins() {
        if (!isAdmin[msg.sender]) throw;
        _
    }
    
    function addAdmin(address newAdmin) onlyAdmins {
        isAdmin[newAdmin] = true;
        AdminAdded(newAdmin);
    }
    
    function removeAdmin(address curAdmin) onlyAdmins {
        isAdmin[curAdmin] = false;
        AdminRemoved(curAdmin);
    }
}

contract PredictionMarket is Owned, Administrated {

    event PollClosed();
    event PollOpened();
    event PredictionUpdate(uint totalYes, uint totalNo);
    event PaidOut();

    struct Bet {
        uint yes;
        uint no;
    }
    
    struct YesNoQuestion {
        string question; //should be a byte32 shortname for gas efficiency
        uint totalYes;
        uint totalNo;
        bool open;
        bool result; //true == yes, false == no
        bool paidOut;
        address trustedSource;
        mapping(address => Bet) bets;
        mapping(uint => address) gamblers;
        uint gamblerCount;
    }

    YesNoQuestion poll;
    
    function PredictionMarket() Owned() Administrated() {
    }
    
    function createNewPoll(string question, address trustedSource) private {
        poll = YesNoQuestion({
            question:question,
            totalYes: 0,
            totalNo: 0,
            open: true,
            result: false,
            paidOut: false,
            trustedSource: trustedSource,
            gamblerCount: 0
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
    
    function setNewTrustedSource(address trustedSource) onlyAdmins openPoll returns (bool success) {
        poll.trustedSource = trustedSource;
        return true;
    }
    
    function openNewPoll(string question, address trustedSource) onlyAdmins closedPoll returns (bool success) {
        if (!poll.paidOut) throw;
        createNewPoll(question, trustedSource);
        PollOpened();
        return true;
    }
    
    function closePoll(bool result) openPoll returns (bool success) {
        if (poll.trustedSource != msg.sender) throw;
        poll.result = result;
        poll.open = false;
        PollClosed();
        return true;
    }
    
    function payOut() closedPoll returns (bool success) {
        if (poll.paidOut) throw;
        poll.paidOut = true;
        var initialContractBalance = this.balance;
        uint totalBets = poll.totalYes + poll.totalNo;
        for(uint i=0;i<poll.gamblerCount;i++)
        {
            address recipient = poll.gamblers[i];
            Bet bet = poll.bets[recipient];
            uint percentageOfPot = poll.result
                ? bet.yes / totalBets
                : bet.no / totalBets;
            if (percentageOfPot > 1) throw;
            // This is how the mapping is cleaned up in the poll struct
            bet.yes = 0;
            bet.no = 0;
            var payout = initialContractBalance * percentageOfPot;
            // Handle divsion and multiplication rounding errors.
            // Sucks a little bit to be the last bet
            if (payout > this.balance) {
                payout = this.balance;
            }
            // TODO maybe an event for sending
            if (!recipient.send(payout)) throw;
        }
        PaidOut();
        return true;
    }
    
    modifier maybeAddGambler() {
        if (msg.value == 0) throw; //no freebies!
        var sender = msg.sender;
        if (   poll.bets[sender].yes == 0
            || poll.bets[sender].no  == 0 ) {
            poll.gamblers[poll.gamblerCount++] = sender;
        }
        _
    }
    
    function betFor() openPoll maybeAddGambler returns (bool success) {
        var value = msg.value;
        poll.totalYes += value;
        poll.bets[msg.sender].yes += value;
        PredictionUpdate(poll.totalYes, poll.totalNo);
        return true;
    }
    
    function betAgainst() openPoll maybeAddGambler returns (bool success) {
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

    function kill() onlyOwner returns (bool success) { 
        selfdestruct(owner); //should actually refund bets
        return true;
    } 
}
