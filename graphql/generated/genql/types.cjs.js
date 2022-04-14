module.exports = {
    "scalars": [
        1,
        2,
        4,
        5,
        8,
        13,
        14,
        17
    ],
    "types": {
        "Activity": {
            "created_at": [
                2
            ],
            "ghost": [
                6
            ],
            "id": [
                1
            ],
            "updated_at": [
                2
            ],
            "user": [
                15
            ],
            "__typename": [
                4
            ]
        },
        "ID": {},
        "DateTime": {},
        "Estimate": {
            "date": [
                4
            ],
            "id": [
                5
            ],
            "q": [
                4
            ],
            "y": [
                4
            ],
            "__typename": [
                4
            ]
        },
        "String": {},
        "Int": {},
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
                15
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
                15
            ],
            "__typename": [
                4
            ]
        },
        "Goal": {
            "blocks": [
                7
            ],
            "computedOwner": [
                16
            ],
            "connected": [
                7
            ],
            "created_at": [
                2
            ],
            "dependsOn": [
                7
            ],
            "description": [
                4
            ],
            "estimate": [
                3
            ],
            "id": [
                5
            ],
            "issuer": [
                0
            ],
            "issuer_id": [
                4
            ],
            "key": [
                8
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
                8
            ],
            "private": [
                8
            ],
            "project": [
                11
            ],
            "project_id": [
                5
            ],
            "relatedTo": [
                7
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
        "Boolean": {},
        "GoalEstimate": {
            "date": [
                4
            ],
            "q": [
                4
            ],
            "y": [
                4
            ],
            "__typename": [
                4
            ]
        },
        "Mutation": {
            "createGoal": [
                7,
                {
                    "description": [
                        4,
                        "String!"
                    ],
                    "estimate": [
                        9
                    ],
                    "key": [
                        8
                    ],
                    "owner_id": [
                        4,
                        "String!"
                    ],
                    "personal": [
                        8
                    ],
                    "private": [
                        8
                    ],
                    "project_id": [
                        5,
                        "Int!"
                    ],
                    "title": [
                        4,
                        "String!"
                    ],
                    "user": [
                        18,
                        "UserSession!"
                    ]
                }
            ],
            "createProject": [
                11,
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
                        18,
                        "UserSession!"
                    ]
                }
            ],
            "inviteUser": [
                6,
                {
                    "email": [
                        4,
                        "String!"
                    ],
                    "user": [
                        18,
                        "UserSession!"
                    ]
                }
            ],
            "__typename": [
                4
            ]
        },
        "Project": {
            "computedOwner": [
                16
            ],
            "created_at": [
                2
            ],
            "description": [
                4
            ],
            "goals": [
                7
            ],
            "id": [
                5
            ],
            "owner": [
                0
            ],
            "slug": [
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
        "Query": {
            "findGhost": [
                6,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        14
                    ]
                }
            ],
            "findUser": [
                15,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        14
                    ]
                }
            ],
            "findUserAnyKind": [
                16,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        14
                    ]
                }
            ],
            "project": [
                11,
                {
                    "slug": [
                        4,
                        "String!"
                    ]
                }
            ],
            "projectGoals": [
                7,
                {
                    "slug": [
                        4,
                        "String!"
                    ]
                }
            ],
            "projectsCompletion": [
                11,
                {
                    "query": [
                        4,
                        "String!"
                    ],
                    "sortBy": [
                        14
                    ]
                }
            ],
            "users": [
                15,
                {
                    "sortBy": [
                        14
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
                13
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
                17
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
                13
            ],
            "__typename": [
                4
            ]
        }
    }
}