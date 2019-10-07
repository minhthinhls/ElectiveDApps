pragma solidity ^0.5.0;

contract Election {
    struct Candidate {// Model a Candidate !
        uint id;
        string name;
        uint voteCount;
    }

    mapping(address => bool) public voters; // Store accounts that have voted
    mapping(uint => Candidate) public candidates; // Read/write Candidates !
    uint public candidatesCount; // Store Candidates Count !

    event votedEvent (
        uint indexed _candidateId
    );

    constructor() public {
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }

    function addCandidate(string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote(uint _candidateId) public {
        // Require that they haven't voted before !
        require(!voters[msg.sender]);
        // Require a valid candidate !
        require(_candidateId > 0 && _candidateId <= candidatesCount);
        // Record that voter has voted !
        voters[msg.sender] = true;
        // Update candidate vote Count !
        candidates[_candidateId].voteCount ++;
        // Trigger voted event !
        emit votedEvent(_candidateId);
    }

}
