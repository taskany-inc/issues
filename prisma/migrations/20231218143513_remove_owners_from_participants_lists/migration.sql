DELETE FROM "_projectParticipants"
USING "Project", "User"
WHERE
    "_projectParticipants"."B" = "Project".id
    AND "User"."activityId" = "_projectParticipants"."A"
    AND "User"."activityId" = "Project"."activityId";

DELETE FROM "_goalParticipants"
USING "Goal", "User"
WHERE
    "_goalParticipants"."B" = "Goal".id
    AND "User"."activityId" = "_goalParticipants"."A"
    AND "User"."activityId" = "Goal"."activityId";
