
var Activity_possibleTypes = ['Activity']
module.exports.isActivity = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isActivity"')
  return Activity_possibleTypes.includes(obj.__typename)
}



var Estimate_possibleTypes = ['Estimate']
module.exports.isEstimate = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isEstimate"')
  return Estimate_possibleTypes.includes(obj.__typename)
}



var Flow_possibleTypes = ['Flow']
module.exports.isFlow = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isFlow"')
  return Flow_possibleTypes.includes(obj.__typename)
}



var Ghost_possibleTypes = ['Ghost']
module.exports.isGhost = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isGhost"')
  return Ghost_possibleTypes.includes(obj.__typename)
}



var Goal_possibleTypes = ['Goal']
module.exports.isGoal = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isGoal"')
  return Goal_possibleTypes.includes(obj.__typename)
}



var Mutation_possibleTypes = ['Mutation']
module.exports.isMutation = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isMutation"')
  return Mutation_possibleTypes.includes(obj.__typename)
}



var Project_possibleTypes = ['Project']
module.exports.isProject = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isProject"')
  return Project_possibleTypes.includes(obj.__typename)
}



var Query_possibleTypes = ['Query']
module.exports.isQuery = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isQuery"')
  return Query_possibleTypes.includes(obj.__typename)
}



var State_possibleTypes = ['State']
module.exports.isState = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isState"')
  return State_possibleTypes.includes(obj.__typename)
}



var User_possibleTypes = ['User']
module.exports.isUser = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isUser"')
  return User_possibleTypes.includes(obj.__typename)
}



var UserAnyKind_possibleTypes = ['UserAnyKind']
module.exports.isUserAnyKind = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isUserAnyKind"')
  return UserAnyKind_possibleTypes.includes(obj.__typename)
}
