package urim.server.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import urim.server.model.CurrentUser;
import urim.server.model.User;
import urim.server.model.UserSetting;

@Service
public class UserDetailsService implements org.springframework.security.core.userdetails.UserDetailsService {
    private final UserService service;

    @Autowired
    public UserDetailsService(UserService service) {
        this.service = service;
    }

    public CurrentUser loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = service.getUserByName(username)
                .orElseThrow(() -> new UsernameNotFoundException(String.format("User %s was not found", username)));
        UserSetting userSetting = service.getUserSettingById(user.getId()).orElse(new UserSetting());
        return new CurrentUser(user, userSetting);
    }
}
