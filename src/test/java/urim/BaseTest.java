package urim;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.mock.web.MockServletContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

@RunWith(SpringJUnit4ClassRunner.class)
@PropertySource("classpath:application-test.properties")
@SpringApplicationConfiguration(classes = MockServletContext.class)
@WebAppConfiguration
public class BaseTest {
    @Test
    public void test() throws Exception {
    }
}