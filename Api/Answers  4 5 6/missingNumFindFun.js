// 6. Imagine you have array of integer from 1 to 100 , the numbers are randomly ordered
// , one number from 1 to 100 is missing , Please write the code for finding the missing
// number

function missingNumberOfArray(numberArray) {
  const n = numberArray.length + 1
  const totalSumoF1toN = parseInt((n * (n + 1)) / 2)

  let sumOfGivenArray = 0

  for (let i = 0; i < numberArray.length; i++) {
    sumOfGivenArray += numberArray[i]
  }
  return totalSumoF1toN - sumOfGivenArray
}

module.exports = missingNumberOfArray
// console.log(missingNumberOfArray([1, 2, 3, 4, 6])) 
