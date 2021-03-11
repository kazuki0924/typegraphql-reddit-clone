erDiagram

user ||--o{ post : owns
post ||--o{ updoot : has
user }|--o{ updoot : has

user {
number id
string username
string email
string password
}

post {
number id
string title
string text
number points
number voteStatus
}

updoot {
number userId
number postId
number value
}
