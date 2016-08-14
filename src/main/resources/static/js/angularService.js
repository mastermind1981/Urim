app.factory('service', function($http, $rootScope) {
    var service = {};

    service.user = {
        id: '',
        username: '',
        email: '',
        role: ''
    };
    service.dashboards = {};
    service.monitors = {};
    service.monitors_settings_map = {
        TYPE: 'monitorType',
        STAT: 'statType',
        URL: 'url',
        PROTOCOL: 'protocol',
        SCRIPT: 'script',
        PARSER: 'parser',
        CHART: 'chart',
        INTERVAL: 'interval'
    };
    service.monitor_results = {};
    service.monitoring = false;
    service.automatic_reconnect = false;
    service.connection_attempts = 0;
    service.marked_delete_monitor = {
        id: '',
        name: ''
    };
    service.user_settings = {
        current_dashboard: '',
        monitor_order: {}
    };
    service.stompClient = null;
    service.session_status = 'expired';
    service.logged_in = false;

    service.create_user = function(data, callback) {
        return $http.post('/users/create', data, {headers: {'X-CSRF-TOKEN': $('meta[name="_csrf"]').attr('content')}}).then(function(response) {
            console.log(response);
            //success
            service.set_user(response.data.data);
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.login = function(data, callback) {
        return $http.post('/users/login', data, {headers: {'X-CSRF-TOKEN': $('meta[name="_csrf"]').attr('content')}}).then(function(response) {
            console.log(response);
            //success
            var cookie = JSON.stringify({csrf: response.headers('X-CSRF-TOKEN')});
            $.cookie('csrf', cookie);
            var username = JSON.stringify({username: response.data.data.username});
            $.cookie('u', username);
            var password = JSON.stringify({password: service.user.password});
            $.cookie('p', password);
            service.set_user(response.data.data);
            var data = {
                userId: service.get_user_property('id')
            };
            service.query_dashboards(data, function(response) {});
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.relogin = function(callback) {
        var cookie = JSON.parse($.cookie('remember_me'));
        var remember_me;
        if (cookie != null) {
            remember_me = cookie.remember_me;
        }
        var data = {};
        if (remember_me) {
            cookie = JSON.parse($.cookie('u'));
            if (cookie != null) {
                service.user.username = cookie.username;
            }
            cookie = JSON.parse($.cookie('p'));
            if (cookie != null) {
                service.user.password = cookie.password;
            }
        }
        var data = service.user;
        if (data.username <= '' || data.password <= '') {
            return;
        }
        return $http.post('/users/login', data, {headers: {'X-CSRF-TOKEN': $('meta[name="_csrf"]').attr('content')}}).then(function(response) {
            console.log(response);
            //success
            var cookie = JSON.stringify({csrf: response.headers('X-CSRF-TOKEN')});
            $.cookie('csrf', cookie);
            service.logged_in = true;
            return cookie;
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return;
        });
    };

    service.get_current_user = function(callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/users/get', {}, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            if (callback != null) {
                return callback(response);
            }
            return response;
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return response;
        });
    };

    service.get_login_status = function() {
        return service.logged_in;
    };

    service.save_user_settings = function(callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        var data = {
            userId: service.user.id,
            currentDashboard: service.user_settings.current_dashboard,
            monitorOrder: service.user_settings.monitor_order
        };
        return $http.post('/users/update_settings', data, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.export_user = function(callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/users/export', {}, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            if (callback != null) {
                return callback(response);
            }
            return response;
        }, function(response) {
            console.log(response);
            //fail
            return response;
        });
    };

    service.set_user = function(data) {
        service.user.id = data.id;
        service.user.username = data.username;
        service.user.email = data.email;
        service.user.role = data.role;
        service.user_settings.current_dashboard = data.userSetting.currentDashboard;
        if (data.userSetting.monitorOrder == null) {
            service.user_settings.monitor_order = {};
        } else {
            service.user_settings.monitor_order = data.userSetting.monitorOrder;
        }
    };

    service.set_user_property = function(key, value) {
        service.user[key] = value;
    };

    service.get_user = function() {
        return service.user;
    };

    service.get_user_property = function(key) {
        return service.user[key];
    };

    service.update_session_status = function(csrf_token) {
        var cookie = JSON.parse($.cookie('csrf'));
        if (cookie.csrf == csrf_token) {
            service.session_status = 'valid';
        } else {
            service.session_status = 'expired';
            service.refresh_csrf(service.relogin);
        }
    };

    service.refresh_csrf = function(callback) {
        $http.get('/csrf', null, {}).then(function(response) {
            console.log(response);
            //success
            var csrf_token = response.headers('X-CSRF-TOKEN');
            var cookie = JSON.stringify({csrf: csrf_token});
            $.cookie('csrf', cookie);
            $('meta[name="_csrf"]').attr('content', csrf_token);
            return callback(csrf_token);
        }, function(response) {
            console.log(response);
            //fail
            return;
        });
    };

    service.get_session_status = function() {
        return service.session_status;
    };

    service.create_dashboard = function(data, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/dashboards/create', data, {headers: {'X-CSRF-TOKEN':cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            service.set_dashboard(response.data.data);
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.query_dashboards = function(data, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/dashboards/get', data, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            service.clear_dashboards();
            service.set_dashboards(response.data.data);
            var current_dashboard = service.user_settings.current_dashboard;
            if (!(current_dashboard > '')) {
                current_dashboard = Object.keys(service.get_dashboards())[0];
            }
            service.select_dashboard(current_dashboard);
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.edit_dashboard = function(data, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/dashboards/edit', data, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            service.set_dashboard(response.data.data);
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.delete_dashboard = function(data, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/dashboards/delete', data, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            delete service.dashboards[response.data.data.id];
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.update_monitor_order = function() {
        var cookie = JSON.parse($.cookie('csrf'));
        var id_order = [];
        var order = $('#dashboard_content').sortable('toArray', {attribute: 'data-id'});
        $.each(order, function(index, value) {
            id_order.push(value.replace("monitor_", ''));
        });
        service.user_settings.monitor_order[service.user_settings.current_dashboard] = id_order;
        service.save_user_settings(function() {});
    };

    service.create_monitor = function(data, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/monitors/create', data, {headers: {'X-CSRF-TOKEN':cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            service.set_monitor(response.data.data);
            service.user_settings.monitor_order[service.user_settings.current_dashboard] = [].concat(service.user_settings.monitor_order[service.user_settings.current_dashboard], response.data.data.id);
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.copy_monitor = function(data, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/monitors/copy', data, {headers: {'X-CSRF-TOKEN':cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            service.set_monitor(response.data.data);
            service.user_settings.monitor_order[service.user_settings.current_dashboard] = [].concat(service.user_settings.monitor_order[service.user_settings.current_dashboard], response.data.data.id);
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.query_monitors = function(data, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/monitors/get', data, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            service.clear_monitors();
            service.set_monitors(response.data.data);
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.update_monitor_settings = function(id, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        var data = service.get_monitor(id);
        return $http.post('/monitors/update_settings', data, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            service.set_monitor(response.data.data);
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.delete_monitor = function(data, callback) {
        var cookie = JSON.parse($.cookie('csrf'));
        return $http.post('/monitors/delete', data, {headers: {'X-CSRF-TOKEN': cookie.csrf}}).then(function(response) {
            console.log(response);
            //success
            delete service.monitors[response.data.data.id];
            service.marked_delete_monitor.id = '';
            service.marked_delete_monitor.name = '';
            return callback(response);
        }, function(response) {
            console.log(response);
            //fail
            service.update_session_status(response.headers('X-CSRF-TOKEN'));
            return callback(response);
        });
    };

    service.set_dashboard = function(data) {
        service.dashboards[data.id] = {
            id: data.id,
            name: data.name
        };
    };

    service.set_dashboard_property = function(id, key, value) {
        service.dashboards[id][key] = value;
    };

    service.clear_dashboards = function() {
        service.dashboards = {};
    };

    service.set_dashboards = function(data) {
        $.each(data, function(index, value) {
            service.set_dashboard(value);
        });
    };

    service.get_dashboard = function(id) {
        return service.dashboards[id];
    };

    service.get_dashboard_property = function(id, key) {
        return service.dashboards[id][key];
    };

    service.get_dashboards = function() {
        return service.dashboards;
    };
    service.select_dashboard = function(id) {
        if (service.user_settings.current_dashboard > '') {
            service.disconnect_monitors();
        }
        if (service.user_settings.monitor_order == null) {
            service.user_settings.monitor_order = {};
        }
        if (service.user_settings.current_dashboard != id) {
            service.user_settings.current_dashboard = id;
            if (id > '' && service.user_settings.monitor_order[service.user_settings.current_dashboard] == null) {
                service.user_settings.monitor_order[service.user_settings.current_dashboard] = [];
            }
            service.save_user_settings(function() {});
        }
        if (id > '') {
            var data = {
                dashboardId: id
            };
            service.query_monitors(data, function() {});
            service.connect_monitors();
        } else {
            service.clear_monitors();
        }
    };

    service.get_user_settings = function() {
        return service.user_settings;
    };

    service.set_monitor = function(data) {
        service.monitors[data.id] = {
            id: data.id,
            name: data.name
        };
        $.each(data.settings, function(index, value) {
            service.monitors[data.id][service.monitors_settings_map[value.key]] = value.value;
        });
        service.monitors[data.id].parser_function = new Function('response', service.monitors[data.id].parser);
    };

    service.set_monitor_property = function(id, key, value) {
        service.monitors[id][key] = value;
    };

    service.clear_monitors = function() {
        service.monitors = {};
    };

    service.set_monitors = function(data) {
        $.each(data, function(index, value) {
            service.set_monitor(value);
        });
    };

    service.get_monitor = function(id) {
        return service.monitors[id];
    };

    service.get_monitor_property = function(id, key) {
        return service.monitors[id][key];
    };

    service.get_monitors = function() {
        return service.monitors;
    };

    service.get_monitor_results = function() {
        return service.monitor_results;
    };

    service.get_monitoring_status = function() {
        return service.monitoring;
    };

    service.get_reconnect_status = function() {
        return service.automatic_reconnect;
    };

    service.toggle_monitoring_status = function() {
        service.automatic_reconnect = false;
        if (service.monitoring) {
            service.disconnect_monitors();
        } else {
            service.connect_monitors();
        }
    };

    service.get_monitor_order = function() {
        return service.user_settings.monitor_order[service.user_settings.current_dashboard];
    };

    service.connect_monitors = function() {
        service.update_session_status('');
        var cookie = JSON.parse($.cookie('csrf'));
        var socket = new SockJS('/monitor_socket');
        service.connection_attempts += 1;
        service.stompClient = Stomp.over(socket);
        service.stompClient.connect({'X-CSRF-TOKEN': cookie.csrf}, function(frame) {
            console.log('Connected: ' + frame);
            service.monitoring = true;
            service.update_session_status(cookie.csrf);
            service.stompClient.subscribe('/results/' + service.user_settings.current_dashboard + '/instant', function(response) {
                service.update_monitor_results(JSON.parse(response.body).data);
                $rootScope.$apply();
            });
            service.stompClient.send("/monitoring/connect", {}, JSON.stringify({ 'name': name, 'dashboardId': service.user_settings.current_dashboard }));
            service.automatic_reconnect = true;
            service.connection_attempts -= 1;
        }, function(message) {
            if (typeof message == "object") {
                console.log(message.headers.message);
            } else if (message.indexOf("Whoops! Lost connection") > -1) {
                console.log('Unexpected disconnect.  Try reconnecting later.');
            }
            service.disconnect_monitors();
            $rootScope.$apply();
            if (service.automatic_reconnect && service.connection_attempts <= 1) {
                setTimeout(service.connect_monitors, 5000);
            }
            service.connection_attempts -= 1;
        });
    };

    service.disconnect_monitors = function() {
        if (service.stompClient != null) {
            service.monitoring = false;
            service.stompClient.send("/monitoring/disconnect", {}, JSON.stringify({ 'name': name, 'dashboardId': service.user_settings.current_dashboard }));
            service.stompClient.disconnect();
        }
        console.log("Disconnected");
    };

    service.update_monitor_results = function(response) {
        if (typeof response == 'object') {
            service.monitor_results = response;
        }
    };

    service.update_delete_monitor = function(id, name) {
        service.marked_delete_monitor.id = id;
        service.marked_delete_monitor.name = name;
    };
    service.get_monitor_marked_for_deletion = function() {
        return service.marked_delete_monitor.id;
    };

    return service;
});