
var Activity_possibleTypes = ['Activity']
module.exports.isActivity = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isActivity"')
  return Activity_possibleTypes.includes(obj.__typename)
}



var Ghost_possibleTypes = ['Ghost']
module.exports.isGhost = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isGhost"')
  return Ghost_possibleTypes.includes(obj.__typename)
}



var Mutation_possibleTypes = ['Mutation']
module.exports.isMutation = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isMutation"')
  return Mutation_possibleTypes.includes(obj.__typename)
}



var Query_possibleTypes = ['Query']
module.exports.isQuery = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isQuery"')
  return Query_possibleTypes.includes(obj.__typename)
}



var Team_possibleTypes = ['Team']
module.exports.isTeam = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isTeam"')
  return Team_possibleTypes.includes(obj.__typename)
}



var User_possibleTypes = ['User']
module.exports.isUser = function(obj) {
  if (!obj || !obj.__typename) throw new Error('__typename is missing in "isUser"')
  return User_possibleTypes.includes(obj.__typename)
}
