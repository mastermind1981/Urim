package urim.client.rest;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import urim.Message;
import urim.client.task.SystemTask;

@RestController
public class SystemClient extends Client {

    @RequestMapping("/system")
    public Message system() {
        return new SystemTask().getStats("0", "system", counter.incrementAndGet());
    }
}