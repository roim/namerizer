function UserNicknamesParameters(userId) {
	this.code = 'userNicknames';
	
	this.userId = userId;
}

function CommonNicknamesForUserParameters(userId) {
	this.code = 'commonNicknames';
	
	this.userId = userId;
}

function SendNicknameParameters(source, target, alias, name, username) {
	this.code = 'sendNickname';

	this.source = source;
	this.target = target;
	this.alias = alias;
	this.name = name;
	this.username = username;	
}

function FacebookDataParameters(userIds) {
	this.code = 'facebookData';

	this.userIds = userIds;
}