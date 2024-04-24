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
        const classes = super.parentClasses.concat(styles.posRelative, styles.padded)
        if (this.isBoundLeaf) {
            classes.push(styles.highlightBordered)
        } else {
            classes.push(styles.bordered)
        }
        return classes
    }

    render(parent: PartTag) {
        this.renderCount++
        parent.code(styles.topRight).text(this.renderCount.toString())
    }
}

class PostApp extends DemoPart<{ post: Post }> {
    authorCard!: UserCard
    assigneeCard!: UserCard
    bodyEditorPart!: TextBlockEditorPart
    commentParts!: CommentPart[]
    stateOutput!: StateOutputPart<Post>

    reloadUsersClicked = Messages.untypedKey()

    async init(): Promise<void> {
        this.authorCard = this.makeBoundPart(UserCard, 'post.author')
        this.assigneeCard = this.makeBoundPart(UserCard, 'post.assignee')
        this.bodyEditorPart = this.makeBoundPart(TextBlockEditorPart, 'post.body')

        this.commentParts = []
        this.state.post.comments.forEach((_, i) => {
            this.commentParts[i] = this.makeBoundPart(CommentPart, `post.comments.${i}`)
        })

        this.stateOutput = this.makeBoundPart(StateOutputPart<Post>, 'post')

        this.onClick(this.reloadUsersClicked, _ => {
            // This is just a nonsense action that changes the state of multiple child parts at once.
            const updates: DeepPartial<Post> = {
                author: makeUser(),
                assignee: makeUser(),
                comments: this.state.post.comments.map(_ => ({
                    author: makeUser(),
                }))
            }
            this.mergeState({ post: updates })
        })

        this.dirty()
    }

    render(parent: PartTag) {
        super.render(parent)
        parent.h1().text(`Post: ${this.state.post.title}`)
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
        parent.part(this.bodyEditorPart)
        parent.h2().text("Comments:")
        for (const commentPart of this.commentParts) {
            parent.part(commentPart)
        }
        parent.hr()
        parent.part(this.stateOutput)
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
    commentBodyPart!: TextBlockEditorPart

    async init() {
        this.authorCard = this.makeBoundPart(UserCard, 'author')
        this.commentBodyPart = this.makeBoundPart(TextBlockEditorPart, 'body')
    }

    render(parent: PartTag) {
        super.render(parent)
        parent.part(this.authorCard)
        parent.part(this.commentBodyPart)
    }
}

class TextBlockEditorPart extends DemoPart<string> {
    toggleEditModeKey = Messages.untypedKey()
    submitKey = Messages.untypedKey()
    bodyChangedKey = Messages.untypedKey()

    isInEditMode = false
    editedBody?: string

    async init() {
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
                this.assignState(renderedBody)
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
        if (this.isInEditMode) {
            const editableBody = unrenderMarkdownParagraphs(this.state)
            parent.textarea({ rows: 10, cols: 60 }).text(editableBody)
                .emitInput(this.bodyChangedKey)
            parent.div(div => {
                div.button().text("Cancel").emitClick(this.toggleEditModeKey)
                div.button().text("Save").emitClick(this.submitKey)
            })
        } else {
            parent.div().text(this.state)
            parent.div(div => {
                div.button().text("Edit").emitClick(this.toggleEditModeKey)
            })
        }
    }
}

class StateOutputPart<T> extends DemoPart<T> {
    render(parent: PartTag) {
        super.render(parent)

        const stateString = Html.escape(JSON.stringify(this.state, null, '  '))
        parent.pre(styles.scrollX, styles.output).text(stateString)
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
        author: makeUser(),
        body: `<p>${faker.lorem.paragraph()}</p>`,
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

    const post: Post = {
        title: "A great post!",
        author: makeUser(),
        assignee: makeUser(),
        body,
        comments: [makeComment(), makeComment()]
    }
    Part.mount(PostApp, container, { post })
}