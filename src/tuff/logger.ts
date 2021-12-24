
type LogLevel = "error" | "warn" | "info" | "debug"

const levels: LogLevel[] = ["error", "warn", "info", "debug"]

// Encapsulates console logging with global level control
export default class Logger {

    // Only messages at or above this level will be shown
    static level: LogLevel = "info"

    constructor(public prefix: string) {

    }

    log(level: LogLevel, m: string, ...args: any[]) {
        if (levels.indexOf(level) > levels.indexOf(Logger.level)) {
            return
        }
        let s = this.prefixMessage(m)
        switch (level) {
            case "debug":
                s = `DEBUG ${s}`
            case "info":
                console.log(s, ...args)
                break
            case "warn":
                console.warn(s, ...args)
                break
            case "error":
                console.error(s, ...args)
                break
        }
    }

    debug(m: string, ...args: any[]) {
        this.log("debug", m, ...args)
    }

    info(m: string, ...args: any[]) {
        this.log("info", m, ...args)
    }

    warn(m: string, ...args: any[]) {
        this.log("warn", m, ...args)
    }

    error(m: string, ...args: any[]) {
        this.log("error", m, ...args)
    }

    time(label: string, fun: () => any) {
        const s = this.prefixMessage(label)
        console.time(s)
        fun()
        console.timeEnd(s)
    }

    private prefixMessage(m: string): string {
        return `[${this.prefix}] ${m}`
    }

}