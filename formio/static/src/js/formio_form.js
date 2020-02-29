// Copyright Nova Code (http://www.novacode.nl)
// See LICENSE file for full licensing details.

$(document).ready(function() {
    var uuid = document.getElementById('form_uuid').value,
        base_url = window.location.protocol + '//' + window.location.host,
        schema_url = '/formio/form/schema/' + uuid,
        options_url = '/formio/form/options/' + uuid,
        submission_url = '/formio/form/submission/' + uuid,
        submit_url = '/formio/form/submit/' + uuid,
        schema = {},
        options = {};

    $.jsonRpc.request(schema_url, 'call', {}).then(function(result) {
        if (!$.isEmptyObject(result)) {
            schema = JSON.parse(result);

            $.jsonRpc.request(options_url, 'call', {}).then(function(_options) {
                var options = JSON.parse(_options);
                var hooks = {
                    'addComponent': function(container, comp, parent) {
                        if (comp.hasOwnProperty('component') && comp.component.hasOwnProperty('data') &&
                            comp.component.data.hasOwnProperty('url') && !$.isEmptyObject(comp.component.data.url)) {
                            comp.component.data.url = base_url.concat(comp.component.data.url, '/', uuid);
                        }
                        return container;
                    }
                };
                options['hooks'] = hooks;

                Formio.createForm(document.getElementById('formio_form'), schema, options).then(function(form) {
                    // Language
                    if ('language' in options) {
                        form.language = options['language'];
                    }
                    window.setLanguage = function(lang) {
                        form.language = lang;
                    };
                    
                    // Events
                    form.on('submit', function(submission) {
                        $.jsonRpc.request(submit_url, 'call', {
                            'uuid': uuid,
                            'data': submission.data
                        }).then(function() {
                            form.emit('submitDone', submission);
                        });
                    });
                    form.on('submitDone', function(submission) {
                        window.parent.postMessage('formioSubmitDone', base_url);
                    });
                    // Set the Submission (data)
                    // https://github.com/formio/formio.js/wiki/Form-Renderer#setting-the-submission
                    $.jsonRpc.request(submission_url, 'call', {}).then(function(result) {
                        if (!$.isEmptyObject(result)) {
                            form.submission = {'data': JSON.parse(result)};
                        }
                    });
                });
            });
        }
    });
});
