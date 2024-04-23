import { faker } from "@faker-js/faker"
import * as styles from './styles.css'
import Html from "../html"
import Messages from "../messages"
import { Part, PartTag } from "../parts"
import { DeepPartial } from "../types"

type Post = {
    title: string
    body: string
    author: User
    assignee: User // todo support binding optional properties?
    comments: Comment[] // todo add bindCollection
}

type User = {
    name: string
    email: string
    avatar: string
}

type Comment = {
    body: string,
    author: User
}

abstract class DemoPart<T> extends Part<T> {
    renderCount = 0

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(styles.posRelative, styles.padded, styles.bordered)
    }

    render(_parent: PartTag) {
        // uncomment to show render count in the top right of each part
        // this.renderCount++
        // parent.div(styles.topRight).text(this.renderCount.toString())
    }
}

class PostApp extends DemoPart<Post> {
    authorCard!: UserCard
    assigneeCard!: UserCard
    commentParts!: CommentPart[]

    reloadUsersClicked = Messages.untypedKey()

    async init(): Promise<void> {
        this.authorCard = this.makeBoundPart(UserCard, 'author')
        this.assigneeCard = this.makeBoundPart(UserCard, 'assignee')

        this.commentParts = []
        this.state.comments.forEach((_, i) => {
            this.commentParts[i] = this.makeBoundPart(CommentPart, `comments.${i}`)
        })

        this.onClick(this.reloadUsersClicked, _ => {
            // This is just a nonsense action that changes the state of multiple child parts at once.
            const updates: DeepPartial<Post> = {
                author: makeUser(),
                assignee: makeUser(),
                comments: this.state.comments.map(_ => ({
                    author: makeUser(),
                }))
            }
            this.mergeState(updates)
        })

        this.dirty()
    }

    render(parent: PartTag) {
        super.render(parent)
        parent.h1().text(`Post: ${this.state.title}`)
        parent.button().text("Reload Users").emitClick(this.reloadUsersClicked)
        parent.div(styles.flexRow, row => {
            row.div(styles.flexStretch, col => {
                col.span().text("Author:")
                col.part(this.authorCard)
            })
            row.div(styles.flexStretch, col => {
                col.span().text("Assignee:")
                col.part(this.assigneeCard)
            })
        })
        parent.p().text(this.state.body)
        parent.h2().text("Comments:")
        for (const commentPart of this.commentParts) {
            parent.part(commentPart)
        }
        parent.hr()
        parent.pre(styles.scrollX, styles.output).text(Html.escape(JSON.stringify(this.state, null, '  ')))
    }
}

class UserCard extends DemoPart<User> {
    render(parent: PartTag) {
        super.render(parent)
        parent.img({ src: this.state.avatar.toString(), width: 30, height: 30 })
        parent.div().text(`${this.state.name} (<a href="mailto:${this.state.email}">${this.state.email})</a>`)
    }
}

class CommentPart extends DemoPart<Comment> {
    authorCard!: UserCard

    isInEditMode = false

    toggleEditModeKey = Messages.untypedKey()
    submitKey = Messages.untypedKey()
    bodyChangedKey = Messages.untypedKey()

    editedBody?: string

    async init() {
        this.authorCard = this.makeBoundPart(UserCard, 'author')

        this.onClick(this.toggleEditModeKey, _ => {
            this.isInEditMode = !this.isInEditMode
            this.editedBody = undefined
            this.dirty()
        })

        this.onClick(this.submitKey, _ => {
            this.isInEditMode = false
            if (this.editedBody) {
                const renderedBody = renderMarkdownParagraphs(this.editedBody)
                this.editedBody = undefined
                this.mergeState({ body: renderedBody })
            } else {
                this.editedBody = undefined
                this.dirty()
            }
        })

        this.onInput(this.bodyChangedKey, m => {
            this.editedBody = m.value
        })
    }

    render(parent: PartTag) {
        super.render(parent)
        parent.part(this.authorCard)
        if (this.isInEditMode) {
            const editableBody = unrenderMarkdownParagraphs(this.state.body)
            parent.textarea({ rows: 10, cols: 60 }).text(editableBody)
                .emitInput(this.bodyChangedKey)
            parent.div(div => {
                div.button().text("Cancel").emitClick(this.toggleEditModeKey)
                div.button().text("Save").emitClick(this.submitKey)
            })
        } else {
            parent.div().text(this.state.body)
            parent.div(div => {
                div.button().text("Edit").emitClick(this.toggleEditModeKey)
            })
        }
    }
}

function getAvatarUrl() {
    return faker.image.avatarGitHub()
}

function makeUser(): User {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    return {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName, provider: 'tuff.test' }),
        avatar: getAvatarUrl(),
    }
}

function makeComment(): Comment {
    return {
        body: `<p>${faker.lorem.paragraph()}</p>`,
        author: makeUser(),
    }
}

function renderMarkdownParagraphs(markdown: string): string {
    return markdown
        .split("\n\n")
        .map(p => `<p>${p}</p>`)
        .join("")
}

function unrenderMarkdownParagraphs(html: string): string {
    return html
        .replaceAll(/<p>/g, '')
        .replaceAll(/<\/p>/g, "\n\n")
        .trim()
}

const container = document.getElementById("state-binding")
if (container) {
    const body = renderMarkdownParagraphs(faker.lorem.paragraphs(3, "\n\n"))

    const state: Post = {
        title: "A great post!",
        body,
        author: makeUser(),
        assignee: makeUser(),
        comments: [makeComment(), makeComment()]
    }
    Part.mount(PostApp, container, state)
}