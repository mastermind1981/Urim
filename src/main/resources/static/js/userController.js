app.controller('UserController', function($scope, service) {
    var user = this;
    user.show_password = false;
    user.confirm_password = "";
    user.error = false;
    user.error_message = "";
    user.success = false;
    user.success_message = "";
    user.roles = ['R_USER', 'RW_USER'];
    user.mode = {
        register: false,
        login: true
    };
    user.logged_in = false;
    user.user = service.user;
    user.register = function() {
        if (user.mode.register) {
            user.create();
        } else {
            user.mode.register = true;
            user.mode.login = false;
        }
    };
    user.create = function() {
        if (!user.validate()) {
            return false;
        }
        var data = {
            username: user.user.username,
            password: user.user.password,
            email: user.user.email,
            role: user.user.role
        };
        user.success = false;
        user.error = false;
        service.create_user(data, function(response) {
            if (response.status >= 200 && response.status < 300) {
                user.success = true;
                user.success_message = "User successfully registered: " + response.data.data.username;
                setTimeout(function() { $('body').trigger('click'); user.success = false; $scope.$digest(); }, 3000);
            } else {
                user.error = true;
                user.error_message = response.data.error + ": " + response.data.message;
            }
        });
    };
    user.login = function() {
        user.mode.login = true;
        user.mode.register = false;
        if (!user.validate()) {
            return false;
        }
        var data = user.user;
        user.success = false;
        user.error = false;
        service.login(data, function(response) {
            if (response.status >= 200 && response.status < 300) {
                user.logged_in = true;
                var cookie = JSON.stringify({csrf: response.headers('X-CSRF-TOKEN')});
                $.cookie('csrf', cookie);
                service.update_session_status(response.headers('X-CSRF-TOKEN'));
                user.success = true;
                user.success_message = "User successfully logged in: " + response.data.data.username;
                var data = {
                    userId: service.get_user_property('id')
                };
                setTimeout(function() { $('body').trigger('click'); user.success = false; $scope.$digest(); }, 3000);
                service.query_dashboards(data, function(response) {});
            } else {
                user.error = true;
                user.error_message = response.data.error + ": " + response.data.message;
            }
        });
    };
    user.validate = function() {
        if (user.user.username == "" || user.user.password == "") {
            user.error = true;
            user.error_message = "Username and Password cannot be blank."
            return false;
        }
        if (user.mode.register) {
            if (user.user.email == "" || user.roles.indexOf(user.user.role) == -1 ) {
                user.error = true;
                user.error_message = "Email and Role cannot be blank."
                return false;
            }
            if (user.user.password != user.confirm_password) {
                user.error = true;
                user.error_message = "Please make sure the password matches."
                return false;
            }
        }
        return true;
    }
});