import { HtmlParentTag } from "../html"
import { Part, PartTag } from "../parts"
import * as styles from './styles.css'

export type Person = { id: string, name: string, birthday?: string }

export class Table extends Part<{ people?: Person[] }> {
    rows!: TableRow[]

    async init() {
        this.state.people ??= [
            { id: '1', name: "Alice", birthday: "Feb 29" },
            { id: '2', name: "Bob" },
            { id: '3', name: "Charlie", birthday: "Jan 1" },
            { id: '4', name: "Denise", birthday: "Dec 31" },
        ]
        this.assignCollection('rows', TableRow, this.state.people)
    }

    render(parent: PartTag) {
        parent.table(styles.dataTable, table => {
            table.thead().tr(tr => {
                tr.th().text("ID")
                tr.th().text("Name")
                tr.th({colSpan: 2}).text("Birthday")
            })
            this.renderCollection(table, 'rows', 'tbody')
        })
    }

}

class TableRow extends Part<Person> {

    get renderAsElement(): keyof HTMLElementTagNameMap & keyof HtmlParentTag {
        return "tr"
    }

    render(parent: PartTag) {
        parent.td().text(this.state.id)
        parent.td().text(this.state.name)
        parent.td({colSpan: 2}).text(this.state.birthday ?? "Birthdayless")
    }

}