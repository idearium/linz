'use strict';

const inflection = require('inflection');
const linz = require('../');

/* GET /admin/model/:model/create */
var route = function (req, res, next) {

    linz.formtools.form.generateFormFromModel(req.linz.model.schema, req.linz.model.linz.formtools.form, {}, 'create', function (err, editForm) {

        if (err) {
            return next(err);
        }

        const data = {};

        (function (cb) {

            linz.api.views.renderNotifications(req, (err, notificationHtml) => {

                if (err) {
                    return cb(err);
                }

                if (notificationHtml) {
                    data.notifications = notificationHtml;
                }

                return cb();

            });

        })(function () {

            const promises = [
                linz.api.views.getScripts(req, res, [
                    {
                        src: '//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.10/handlebars.min.js',
                        integrity: 'sha256-0JaDbGZRXlzkFbV8Xi8ZhH/zZ6QQM0Y3dCkYZ7JYq34=',
                        crossorigin: 'anonymous',
                    },
                    {
                        src: `${linz.get('admin path')}/public/js/jquery.binddata.js`,
                    },
                    {
                        src: `${linz.get('admin path')}/public/js/documentarray.js`,
                    },
                    {
                        src: `${linz.get('admin path')}/public/js/model/edit.js`,
                    },
                ]),
                linz.api.views.getStyles(req, res),
            ];

            const form = req.linz.model.linz.formtools.form;
            const actionUrl = linz.api.url.getAdminLink(req.linz.model, 'create');
            const cancelUrl = linz.api.url.getAdminLink(req.linz.model);

            const renderFormActions = () => new Promise((resolve, reject) => linz.api.views.renderPartial('form-actions', {
                actionUrl,
                cancelUrl,
            }, (err, html) => {

                if (err) {
                    return reject(err);
                }

                return resolve(html);

            }));

            if (form.formFooter) {
                promises.push(renderFormActions().then(formActions => form.formFooter(req, { formActions })));
            }

            if (form.formHeader) {
                promises.push(renderFormActions().then(formActions => form.formHeader(req, { formActions })));
            }

            Promise.all(promises)
                .then(([scripts, styles, footer, header]) => {

                    const singular = inflection.humanize(req.linz.model.linz.formtools.model.label, true);

                    return res.render(linz.api.views.viewPath('modelCreate.jade'), Object.assign(data, {
                        actionUrl: linz.api.url.getAdminLink(req.linz.model, 'create'),
                        cancelUrl: linz.api.url.getAdminLink(req.linz.model),
                        form: editForm.render(),
                        formFooterContent: footer,
                        formHeaderContent: header,
                        label: {
                            singular,
                            plural: req.linz.model.linz.formtools.model.plural,
                        },
                        model: req.linz.model,
                        pageTitle: `Create a new ${singular}`,
                        scripts,
                        styles,
                        view: 'model-create',
                    }));

                })
                .catch(next);

        });

    });

};

module.exports = route;
