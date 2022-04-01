module.exports = {
    "scalars": [
        1,
        2,
        4,
        7,
        8,
        10,
        13
    ],
    "types": {
        "Activity": {
            "created_at": [
                2
            ],
            "id": [
                1
            ],
            "updated_at": [
                2
            ],
            "__typename": [
                4
            ]
        },
        "ID": {},
        "DateTime": {},
        "Ghost": {
            "activity": [
                0
            ],
            "created_at": [
                2
            ],
            "email": [
                4
            ],
            "host": [
                11
            ],
            "host_id": [
                4
            ],
            "id": [
                1
            ],
            "updated_at": [
                2
            ],
            "user": [
                11
            ],
            "__typename": [
                4
            ]
        },
        "String": {},
        "Mutation": {
            "createGhost": [
                3,
                {
                    "email": [
                        4,
                        "String!"
                    ],
                    "user": [
                        12,
                        "UserSession!"
                    ]
                }
            ],
            "createTeam": [
                9,
                {
                    "description": [
                        4
                    ],
                    "title": [
                        4,
                        "String!"
                    ],
                    "user": [
                        12,
                        "UserSession!"
                    ]
                }
            ],
            "createTestUser": [
                11,
                {
                    "email": [
                        4,
                        "String!"
                    ]
                }
            ],
            "__typename": [
                4
            ]
        },
        "Query": {
            "findGhost": [
                3,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        8
                    ]
                }
            ],
            "findUser": [
                11,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        8
                    ]
                }
            ],
            "teams": [
                9,
                {
                    "sortBy": [
                        8
                    ]
                }
            ],
            "users": [
                11,
                {
                    "sortBy": [
                        8
                    ]
                }
            ],
            "__typename": [
                4
            ]
        },
        "Role": {},
        "SortOrder": {},
        "Team": {
            "created_at": [
                2
            ],
            "description": [
                4
            ],
            "id": [
                10
            ],
            "owner": [
                0
            ],
            "owner_id": [
                4
            ],
            "title": [
                4
            ],
            "updated_at": [
                2
            ],
            "__typename": [
                4
            ]
        },
        "Int": {},
        "User": {
            "activity": [
                0
            ],
            "activity_id": [
                4
            ],
            "created_at": [
                2
            ],
            "email": [
                4
            ],
            "id": [
                1
            ],
            "image": [
                4
            ],
            "name": [
                4
            ],
            "role": [
                7
            ],
            "updated_at": [
                2
            ],
            "__typename": [
                4
            ]
        },
        "UserSession": {
            "email": [
                4
            ],
            "id": [
                1
            ],
            "image": [
                4
            ],
            "name": [
                4
            ],
            "role": [
                7
            ],
            "__typename": [
                4
            ]
        },
        "Boolean": {}
    }
}