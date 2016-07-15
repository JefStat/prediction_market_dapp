ontract Owned {
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
    }
}

contract Administrated {
    mapping(address => bool) isAdmin;
    
    modifier onlyAdmins() {
        if (!isAdmin[msg.sender]) throw;
        _
    }
    
    function addAdmin(address newAdmin) onlyAdmins {
        isAdmin[newAdmin] = true;
    }
    
    function removeAdmin(address curAdmin) onlyAdmins {
        isAdmin[curAdmin] = false;
    }
}


contract Poll is Owned, Administrated{

    event PollClosed();
    event PollOpened();
    event VotedFor(uint votesFor);
    event VotedAgainst(uint votesAgainst);

    struct Voter {
        bool voted;
    }
    
    struct YesNoQuestion {
        string question;
        uint yes;
        uint no;
        bool open;
        mapping(address => Voter) voters;
    }

    uint currentPollIndex;
    YesNoQuestion[] polls;
    
    function Poll(){
        currentPollIndex = 0;
    }
    
    function getCurrentPoll() private returns (YesNoQuestion){
        return polls[currentPollIndex];
    }
    
    function createNewPoll(string question) private {
        currentPollIndex++;
        var poll = getCurrentPoll();
        poll = YesNoQuestion({
            question:question,
            yes: 0,
            no: 0,
            open: true
        });
    }
    
    function setNewPoll(string question) onlyAdmins returns (bool success) {
        if (getCurrentPoll().open) throw;
        createNewPoll(question);
        PollOpened();
        return true;
    }
    
    function closePoll() onlyAdmins returns (bool success) {
        if (!getCurrentPoll().open) throw;
        getCurrentPoll().open = false;
        PollClosed();
        return true;
    }
    
    modifier voteOnce() {
        if (!getCurrentPoll().open) throw;
        if (polls[currentPollIndex].voters[msg.sender].voted) throw;
        polls[currentPollIndex].voters[msg.sender].voted = true;
        _
    }

    function voteFor() voteOnce returns (bool success)  {
        getCurrentPoll().yes++;
        VotedFor(getCurrentPoll().yes);
        return true;
    }
    
    function voteAgainst() voteOnce returns (bool success) {
        getCurrentPoll().no++;
        VotedAgainst(getCurrentPoll().no);
        return true;
    }
    
    //fallback function
    function () {
        throw;
    }

    function kill() onlyOwner returns (bool success) { 
        suicide(owner);
        return true;
    }
}

B
B
A
A
A
A
A
A
A
A
A
B
B
B
B
B
B
B
B
B

