module.exports = {
    "scalars": [
        0,
        2,
        4,
        5,
        7,
        9,
        11
    ],
    "types": {
        "DateTime": {},
        "Mutation": {
            "createTeam": [
                6,
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
        "Query": {
            "teams": [
                6,
                {
                    "sortBy": [
                        5
                    ]
                }
            ],
            "users": [
                8,
                {
                    "sortBy": [
                        5
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
                7
            ],
            "owner": [
                8
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
        "Int": {},
        "User": {
            "created_at": [
                0
            ],
            "email": [
                2
            ],
            "id": [
                9
            ],
            "image": [
                2
            ],
            "name": [
                2
            ],
            "role": [
                4
            ],
            "updated_at": [
                0
            ],
            "__typename": [
                2
            ]
        },
        "ID": {},
        "UserSession": {
            "email": [
                2
            ],
            "id": [
                9
            ],
            "image": [
                2
            ],
            "name": [
                2
            ],
            "role": [
                4
            ],
            "__typename": [
                2
            ]
        },
        "Boolean": {}
    }
}