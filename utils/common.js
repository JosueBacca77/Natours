const filterObject = (obj, ...allowed) => {
  //Returns an object with only the allowed fields that are in obj
  const newObj = {};
  Object.keys(obj).forEach((field) => {
    if (allowed.includes(field)) newObj[field] = obj[field];
  });
  return newObj;
};

function isNumber(str) {
  return !isNaN(str);
}

module.exports = { filterObject, isNumber };
