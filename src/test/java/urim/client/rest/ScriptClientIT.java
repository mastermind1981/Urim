package urim.client.rest;

import org.junit.Before;
import org.junit.Test;
import org.springframework.boot.test.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import urim.BaseIT;

import java.net.URL;

import static org.hamcrest.Matchers.containsString;
import static org.junit.Assert.assertThat;

public class ScriptClientIT extends BaseIT {

    private ResponseEntity<String> response;
    private String scriptExtension;

    @Before
    public void setUp() throws Exception {
        this.template = new TestRestTemplate();
        String osName = System.getProperty("os.name");
        if (osName.equals( "Windows NT" ) || osName.equals( "Windows 95" ) || osName.contains( "Windows" )) {
            this.scriptExtension = "bat";
        } else if (osName.contains( "Linux" ) || osName.contains( "Mac OS X" )) {
            this.scriptExtension = "sh";
        }
    }

    @Test
    public void getStats() throws Exception {
        this.base = new URL(String.format("http://localhost:%s/script", Integer.toString(this.port)));
        this.response = this.template.getForEntity(this.base.toString(), String.class);
        assertThat(this.response.getBody(), containsString("ping"));
        assertThat(this.response.getBody(), containsString("id"));
        assertThat(this.response.getBody(), containsString("data"));
        assertThat(this.response.getBody(), containsString("returnValue"));
        assertThat(this.response.getBody(), containsString("output"));
        assertThat(this.response.getBody(), containsString("hello, world"));
        assertThat(this.response.getBody(), containsString("error"));
        assertThat(this.response.getBody(), containsString("source"));
        assertThat(this.response.getBody(), containsString("parameters"));
        assertThat(this.response.getBody(), containsString("interval"));
        assertThat(this.response.getBody(), containsString("name"));
        assertThat(this.response.getBody(), containsString("statType"));
        assertThat(this.response.getBody(), containsString("script"));
        assertThat(this.response.getBody(), containsString("server"));
        assertThat(this.response.getBody(), containsString("port"));
        assertThat(this.response.getBody(), containsString("type"));

        this.base = new URL(String.format("http://localhost:%s/script?value=%s", Integer.toString(this.port), "hello"));
        this.response = this.template.getForEntity(this.base.toString(), String.class);
        assertThat(this.response.getBody(), containsString("helloaaaaa"));

        this.base = new URL(String.format("http://localhost:%s/script?value=", Integer.toString(this.port)));
        this.response = this.template.getForEntity(this.base.toString(), String.class);
        assertThat(this.response.getBody(), containsString("ping"));
    }
}