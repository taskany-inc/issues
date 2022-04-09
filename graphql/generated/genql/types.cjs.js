module.exports = {
    "scalars": [
        1,
        2,
        4,
        7,
        9,
        10,
        13,
        15
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
                        14,
                        "UserSession!"
                    ]
                }
            ],
            "createProject": [
                6,
                {
                    "description": [
                        4
                    ],
                    "owner_id": [
                        4,
                        "String!"
                    ],
                    "title": [
                        4,
                        "String!"
                    ],
                    "user": [
                        14,
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
        "Project": {
            "created_at": [
                2
            ],
            "description": [
                4
            ],
            "id": [
                7
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
        "Query": {
            "findGhost": [
                3,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        10
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
                        10
                    ]
                }
            ],
            "findUserAnyKind": [
                12,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        10
                    ]
                }
            ],
            "projects": [
                6,
                {
                    "sortBy": [
                        10
                    ]
                }
            ],
            "users": [
                11,
                {
                    "sortBy": [
                        10
                    ]
                }
            ],
            "__typename": [
                4
            ]
        },
        "Role": {},
        "SortOrder": {},
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
                9
            ],
            "updated_at": [
                2
            ],
            "__typename": [
                4
            ]
        },
        "UserAnyKind": {
            "activity": [
                0
            ],
            "email": [
                4
            ],
            "id": [
                4
            ],
            "image": [
                4
            ],
            "kind": [
                13
            ],
            "name": [
                4
            ],
            "__typename": [
                4
            ]
        },
        "UserKind": {},
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
                9
            ],
            "__typename": [
                4
            ]
        },
        "Boolean": {}
    }
}