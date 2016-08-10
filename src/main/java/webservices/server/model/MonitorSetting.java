package webservices.server.model;

import javax.persistence.*;

@Entity
@Table(name = "monitor_setting")
public class MonitorSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private long id;

    @Column(name = "property", nullable = false)
    @Enumerated(EnumType.STRING)
    private Setting key;

    @Column(length = 1023, name = "value", nullable = true)
    private String value;

    public MonitorSetting() {}

    public MonitorSetting(Setting key, String value) {
        this.key = key;
        this.value = value;
    }

    @Override
    public String toString() {
        return String.format(
                "MonitorSetting[id=%d, key='%s']", id, key);
    }

    public enum Setting {
        TYPE, STAT, SCRIPT, PARSER, CHART, PROTOCOL, INTERVAL, URL
    }

    public enum Types {
        system, script
    }

    public enum Stats {
        cpu, ram, fs
    }

    public enum Charts {
        status, gauge, bar
    }

    public enum Protocols {
        rest, mq
    }

    public enum Intervals {
        s5, s10, s30, m1, m5, m15, m30, h1, h2, d1
    }

    public long getId() {
        return this.id;
    }

    public Setting getKey() {
        return this.key;
    }

    public String getValue() {
        return this.value;
    }

    public void setId(long id) {
        this.id = id;
    }

    public void setKey(Setting key) {
        this.key = key;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
