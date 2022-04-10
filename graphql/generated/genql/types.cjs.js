module.exports = {
    "scalars": [
        1,
        2,
        4,
        6,
        7,
        10,
        12,
        13,
        16
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
                14
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
                14
            ],
            "__typename": [
                4
            ]
        },
        "String": {},
        "Goal": {
            "blocks": [
                5
            ],
            "connected": [
                5
            ],
            "created_at": [
                2
            ],
            "dependsOn": [
                5
            ],
            "description": [
                4
            ],
            "estimate": [
                2
            ],
            "id": [
                6
            ],
            "issuer": [
                0
            ],
            "issuer_id": [
                4
            ],
            "key": [
                7
            ],
            "owner": [
                0
            ],
            "owner_id": [
                4
            ],
            "participants": [
                0
            ],
            "personal": [
                7
            ],
            "private": [
                7
            ],
            "project": [
                9
            ],
            "project_id": [
                6
            ],
            "quarter": [
                10
            ],
            "relatedTo": [
                5
            ],
            "title": [
                4
            ],
            "updated_at": [
                2
            ],
            "year": [
                4
            ],
            "__typename": [
                4
            ]
        },
        "Int": {},
        "Boolean": {},
        "Mutation": {
            "createGoal": [
                5,
                {
                    "description": [
                        4,
                        "String!"
                    ],
                    "key": [
                        7
                    ],
                    "owner_id": [
                        4,
                        "String!"
                    ],
                    "personal": [
                        7
                    ],
                    "private": [
                        7
                    ],
                    "project_id": [
                        6,
                        "Int!"
                    ],
                    "title": [
                        4,
                        "String!"
                    ],
                    "user": [
                        17,
                        "UserSession!"
                    ]
                }
            ],
            "createProject": [
                9,
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
                        17,
                        "UserSession!"
                    ]
                }
            ],
            "inviteUser": [
                3,
                {
                    "email": [
                        4,
                        "String!"
                    ],
                    "user": [
                        17,
                        "UserSession!"
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
                6
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
        "Quarter": {},
        "Query": {
            "findGhost": [
                3,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        13
                    ]
                }
            ],
            "findUser": [
                14,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        13
                    ]
                }
            ],
            "findUserAnyKind": [
                15,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        13
                    ]
                }
            ],
            "projects": [
                9,
                {
                    "sortBy": [
                        13
                    ]
                }
            ],
            "users": [
                14,
                {
                    "sortBy": [
                        13
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
                12
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
                16
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
                12
            ],
            "__typename": [
                4
            ]
        }
    }
}