if (Meteor.isClient) {
    // Event handlers.
    Template.layout.events({
        'click #btnRun, click .alg, click #share, submit': function(event, template) {
            if (event.currentTarget.id == 'btnRun') {
                // Run button click.
                $('.panel-collapse.editor').collapse('hide');
                $('#outputPanel').collapse('show');

                StripsClient.run($('#txtDomainCode').val(), $('#txtProblemCode').val(), $('.alg.active').text());
            }
            else if (event.currentTarget.className.indexOf('alg') != -1) {
                // Toggle algorithm buttons.
                $('.alg').removeClass('active');
                $(event.currentTarget).addClass('active');

                updateShareLink();
            }
            else if (event.currentTarget.id == 'share') {
                var modal = $('#shareModal .modal-body');
                modal.find('.domain').text($('#txtDomainName').val());
                modal.find('.problem').text($('#txtProblemName').val());
                modal.find('.link').attr('href', $(event.currentTarget).attr('href'));
                modal.find('.linkText').text($(event.currentTarget).attr('href'))

                $('#shareModal').modal('show');

                return false;
            }
            else if (event.type == 'submit') {
                // Save button click.
                if (!Meteor.userId()) {
                    $('#login-dropdown-list').find('a').trigger('click');
                }
                else {
                    save(function(result) {
                        // Update preferences.
                        selection = result;
                        //localStorage['selection'] = JSON.stringify(selection);
                        $('#ctrlDomain').val(result.domain);
                        onDomainChange($('#ctrlDomain'));
                        $('#ctrlProblem').val(result.problem);
                        onProblemChange($('#ctrlProblem'));
                    });
                }

                // Prevent actual form submisson.
                return false;
            }
        }
    });

    Template.home.events({
        'click #top': function(event, template) {
            // Scroll to top of page.
            $('#domainPanel').collapse('show');
            $('#problemPanel').collapse('show');
            $('#outputPanel').collapse('hide');
            
            $('html, body').stop().animate({ scrollTop: $('html, body').offset().top }, 1000, function() {
            });
        }
    });

    Template.domainForm.events({
        'change #ctrlDomain': function(event, template) {
            onDomainChange($(event.target));
        }
    });

    Template.problemForm.events({
        'change #ctrlProblem': function(event, template) {
            onProblemChange($(event.target));
        }
    });

    function onDomainChange(element) {
        // Domain dropdown changed.
        var id = element.val();
        if (id) {
            var domain = {name: '', code: ''};

            // Find the domain in the db that matches the selected id.
            if (element.prop('selectedIndex') > 0) {
                domain = Domains.findOne({ _id: id });
            }

            // Populate the name and code for the domain.
            $('#txtDomainName').val(domain.name);
            $('#txtDomainCode').val(domain.code);

            // Update problem dropdown.
            Session.set('domainId', id);

            // Remember dropdown selection.
            selection.domain = id;
            //localStorage['selection'] = JSON.stringify(selection);
        }

        if (element.prop('selectedIndex') == 0) {
            selection.domain = null;
        }

        updateShareLink();
    }

    function onProblemChange(element) {
        // Problem dropdown changed.
        var id = element.val();
        if (id) {
            var problem = {name: '', code: ''};

            // Find the problem in the db that matches the selected id.
            if (element.prop('selectedIndex') > 0) {
                problem = Problems.findOne({ _id: id });

                // Remember dropdown selection.
                selection.problem = id;
                //localStorage['selection'] = JSON.stringify(selection);                    
            }

            // Populate the name and code for the problem.
            $('#txtProblemName').val(problem.name);
            $('#txtProblemCode').val(problem.code);
        }

        updateShareLink();
    }

    function updateShareLink() {
        // Display permalink.
        var share = $('#share');
        
        var url = 'http://' + window.location.host + '?d=' + selection.domain;
        if (selection.problem && $('#ctrlProblem').prop('selectedIndex') > 0) {
            url += '&p=' + selection.problem;
        }

        url += '&a=' + $('.alg.active').text();

        share.attr('href', url);

        if (selection.domain) {
            share.show();
        }
        else {
            share.hide();
        }
    }

    function save(callback) {
        var domainId = $('#ctrlDomain').val();
        var domainName = $('#ctrlDomain option:selected').text();
        var txtDomainName = $('#txtDomainName').val();
        var txtProblemName = $('#txtProblemName').val();

        if (txtDomainName) {
            if (domainId && domainId.indexOf('<Create your own>') == -1) {
                Meteor.call('updateDomain', domainId, txtDomainName, $('#txtDomainCode').val(), function(err, domainId) {
                    // Update problem, if one exists.
                    var problemId = $('#ctrlProblem').val();
                    if (problemId && problemId.indexOf('<Create your own>') == -1) {
                        Meteor.call('updateProblem', domainId, problemId, txtProblemName, $('#txtProblemCode').val(), function(err, problemId) {
                            if (callback) {
                                callback({ domain: domainId, problem: problemId });
                            }
                        });
                    }
                    else if (txtProblemName) {
                        Meteor.call('addProblem', domainId, txtProblemName, $('#txtProblemCode').val(), function(err, problemId) {
                            if (callback) {
                                callback({ domain: domainId, problem: problemId });
                            }
                        });
                    }
                    else {
                        if (callback) {
                            callback({ domain: domainId, problem: null });
                        }                        
                    }
                });
            }
            else {
                Meteor.call('addDomain', txtDomainName, $('#txtDomainCode').val(), function(err, domainId) {
                    // Insert new problem, if one exists.
                    var problemId = $('#ctrlProblem').val();

                    if ((!problemId || problemId.indexOf('<Create your own>') != -1) && txtProblemName) {
                        Meteor.call('addProblem', domainId, txtProblemName, $('#txtProblemCode').val(), function(err, problemId) {
                            if (callback) {
                                callback({ domain: domainId, problem: problemId });
                            }
                        });
                    }
                    else {
                        if (callback) {
                            callback({ domain: domainId, problem: problemId });
                        }
                    }
                });
            }
        }
    }    
}