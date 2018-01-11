const HEADER_REGEX = /bearer token-(.*)$/;

exports.authenticate = async ({ header: { authorization } }, Users) => {
  const email = authorization && HEADER_REGEX.exec(authorization)[1];
  return email && (await Users.findOne({ email }));
};
