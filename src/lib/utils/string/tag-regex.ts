/**
 * @example console.log(tagRegex.test('this is a message with an #epic tag')) => true
 * @example console.log('this is a message with an #epic tag'.match(tagRegex)) => '#epic'
 */
export const tagRegex = /#([^\s#]+)/gim;
