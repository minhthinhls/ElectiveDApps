App = {
    web3Provider: null,
    contracts: {},
    accounts: null,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Election.json", function (election) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);
            return [App.listenForEvents(), App.render()];
        });
    },

    listenForEvents: function () { // Listen for events emitted from the contract !
        App.contracts.Election.deployed().then(function (instance) {
            /*  Restart Chrome if you are unable to receive this event.
                This is a known issue with Metamask,
                https://github.com/MetaMask/metamask-extension/issues/2393 */
            instance.votedEvent({}, {
                fromBlock: 'latest',
                toBlock: 'latest'
            }).watch(function (error, event) {
                console.log("event triggered", event);
                return App.render(); // Reload when a new vote is recorded !
            });
        });
    },

    render: function () {
        var electionInstance;
        var loader = $("#loader");
        var content = $("#content");

        loader.show();
        content.hide();

        // Load accounts data
        web3.eth.getAccounts(function (err, accounts) {
            if (err === null) {
                App.accounts = accounts;
                $("#accountAddress").html("Your Account: " + accounts[0]);
            }
        });

        // Load contract data
        App.contracts.Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.candidatesCount();
        }).then(function (candidatesCount) {
            var candidatesResults = $("#candidatesResults");
            candidatesResults.empty();

            var candidatesSelect = $('#candidatesSelect');
            candidatesSelect.empty();

            for (var i = 1; i <= candidatesCount; i++) {
                electionInstance.candidates(i).then(function (candidate) {
                    var id = candidate[0];
                    var name = candidate[1];
                    var voteCount = candidate[2];

                    // Render candidate Result
                    var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
                    candidatesResults.append(candidateTemplate);

                    // Render candidate ballot option
                    var candidateOption = "<option value='" + id + "' >" + name + "</option>";
                    candidatesSelect.append(candidateOption);
                });
            }
            return electionInstance.voters(App.accounts[0]);
        }).then(function (hasVoted) {
            // Do not allow a user to vote
            if (hasVoted) {
                $('form').hide();
            }
            loader.hide();
            content.show();
        }).catch(function (error) {
            console.warn(error);
        });
    },

    castVote: function () {
        var candidateId = $('#candidatesSelect').val();
        App.contracts.Election.deployed().then(function (instance) {
            return instance.vote(candidateId, {from: App.accounts[0]});
        }).then(function (result) {
            // Wait for votes to update
            $("#content").hide();
            $("#loader").show();
        }).catch(function (err) {
            console.error(err);
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
