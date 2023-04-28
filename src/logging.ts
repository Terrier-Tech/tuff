
const levels = ["error", "warn", "info", "debug"]

type LogLevel = typeof levels[number]

// Encapsulates console logging with global level control
export class Logger {

    // Only messages at or above this level will be shown
    static level: LogLevel = "info"

    static shouldPrintLevel(l: LogLevel): boolean {
        return levels.indexOf(l) <= levels.indexOf(Logger.level)
    }

    constructor(public prefix: string) {

    }

    log(level: LogLevel, m: string, ...args: any[]) {
        if (!Logger.shouldPrintLevel(level)) {
            return
        }
        let s = this.prefixMessage(m, level)
        switch (level) {
            case "debug":
                console.debug(s, ...args)
                break
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

    // Prints the execution time of the passed function as info
    time(label: string, fun: () => any) {
        this.levelTime(label, 'info', fun)
    }

    // Prints the execution time of the passed function as debug
    debugTime(label: string, fun: () => any) {
        this.levelTime(label, 'debug', fun)
    }

    // Prints the execution time of the passed function at the given level
    levelTime(label: string, level: LogLevel, fun: () => any) {
        if (Logger.shouldPrintLevel(level)) {
            const s = this.prefixMessage(label, level)
            console.time(s)
            fun()
            console.timeEnd(s)
        }
        else {
            fun() // we still need to actually execute the function
        }
    }


    private prefixMessage(m: string, level: LogLevel): string {
        let s = `[${this.prefix}] ${m}`
        if (level == 'debug') {
            s = `DEBUG ${s}`
        }
        return s
    }

}