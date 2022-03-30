module.exports = {
    "scalars": [
        0,
        2,
        4,
        6,
        7,
        11
    ],
    "types": {
        "DateTime": {},
        "Mutation": {
            "createTeam": [
                8,
                {
                    "description": [
                        2
                    ],
                    "title": [
                        2,
                        "String!"
                    ],
                    "user": [
                        10,
                        "UserSession!"
                    ]
                }
            ],
            "__typename": [
                2
            ]
        },
        "String": {},
        "Post": {
            "author": [
                9
            ],
            "author_id": [
                2
            ],
            "content": [
                2
            ],
            "created_at": [
                0
            ],
            "id": [
                4
            ],
            "title": [
                2
            ],
            "updated_at": [
                0
            ],
            "__typename": [
                2
            ]
        },
        "Int": {},
        "Query": {
            "teams": [
                8,
                {
                    "sortBy": [
                        7
                    ]
                }
            ],
            "users": [
                9,
                {
                    "sortBy": [
                        7
                    ]
                }
            ],
            "__typename": [
                2
            ]
        },
        "Role": {},
        "SortOrder": {},
        "Team": {
            "created_at": [
                0
            ],
            "description": [
                2
            ],
            "id": [
                4
            ],
            "owner": [
                9
            ],
            "owner_id": [
                2
            ],
            "title": [
                2
            ],
            "updated_at": [
                0
            ],
            "__typename": [
                2
            ]
        },
        "User": {
            "created_at": [
                0
            ],
            "email": [
                2
            ],
            "id": [
                2
            ],
            "image": [
                2
            ],
            "name": [
                2
            ],
            "posts": [
                3
            ],
            "role": [
                6
            ],
            "updated_at": [
                0
            ],
            "__typename": [
                2
            ]
        },
        "UserSession": {
            "email": [
                2
            ],
            "id": [
                2
            ],
            "image": [
                2
            ],
            "name": [
                2
            ],
            "role": [
                6
            ],
            "__typename": [
                2
            ]
        },
        "Boolean": {}
    }
}