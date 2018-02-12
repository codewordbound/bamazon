var mysql = require("mysql");
var inquirer = require('inquirer');
var json_tb = require('json-table');

var connection = {};

connection = mysql.createConnection(
	{
		host: 'localhost',
		port: 8889,
		user: "root",
		password: "root",
		// database: "bamazon"
	});

connection.connect(function(err) {
			if (err) throw err;
		
			console.log("connected as id " + connection.threadId);
			displayInventory();
		});




function useDatabase() {
  connection.query(
		'USE bamazon',
		
		function (err, res) {
			if (err) throw err;
		}
	);
}

function displayInventory() {
	console.log('\n -------- ====== Welcome to bamazon! ====== --------\n');

	useDatabase();

	connection.query(
		'SELECT item_id, product_name, department_name, price, stock_quantity FROM products',
		function (err, res) {
			if (err) throw err;
			
			if (res) {

				//prints JSON object into a table using npm json-table

				var json_tb_out = new json_tb(res, {
					chars: { 
            'top': '═' , 'top-mid': '╤' , 'top-left': '╔' ,
            'top-right': '╗', 'bottom': '═' , 'bottom-mid': '╧' ,
            'bottom-left': '╚' , 'bottom-right': '╝', 'left': '║' ,
            'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼',
            'right': '║' , 'right-mid': '╢' , 'middle': '│' 
					}
				}, 
				
				function(table) {
					table.show();
					confirmPurchase();
				});
			}
		}
	);
}

function confirmPurchase() {

	inquirer.prompt(
		{
			name: 'confirm',
			type: 'confirm',
			message: 'Would you like to make a purchase?',
			default: 'true'
		}
	)
	.then(function(answers) {
		if (answers.confirm) {
			purchasePrompt();
		} 
		
		else {
			console.log('\nCome back again!\n');
			connection.end();
		}
	});
}

function purchasePrompt() {
	inquirer.prompt([
		{
			name: 'id',
			type: 'input',
			message: 'Which item_id would you like to buy?',
			validate: function(input) {
				pattern = '^[0-9]+$';
				isValid = input.match(pattern);
				
				if(isValid) {
					return true;
				} 
				
				else {
					return 'Invalid input. Enter an integer item_id.';
				}
			}
		},
		{
			name: 'qty',
			type: 'input',
			message: 'What quantity of that item would you like to buy?',
			validate: function(input) {
				pattern = '^[0-9]+$';
				isValid = input.match(pattern);
				
				if(isValid) {
					return true;
				} 
				
				else {
					return 'Invalid input. Enter an integer quantity.';
				}
			}
		}
	])

	.then(function checkStock(answers) {
		var buyQty = Number(answers.qty);
		var id = Number(answers.id);

		connection.query(
			'SELECT * FROM products WHERE ?',
			{item_id: id},

			function(err, res) {
				if (err) throw err;
				
				if (res[0]) {
					var stockQty = res[0].stock_quantity;

					if (buyQty > stockQty) {
						console.log(
							'\nThe store does not have ' + 
							buyQty + ' of item_id ' + id + 
							'. Please revise your selection.\n'
						);
						purchasePrompt();
					} 

					else {
						purchase(buyQty, res[0]);
					}
				} 
				
				else {
					console.log('\nThat item_id does not exist yet, try another.\n');
					purchasePrompt();
				}
			}
		);
	});
}

function purchase(buyQty, itemData) {
	var id = itemData.item_id;
	var price = itemData.price;
	var stockQty = itemData.stock_quantity;
	var newStockQty = stockQty - buyQty;
	var cost = (price * buyQty).toFixed(2);

	connection.query(
		'UPDATE products SET ? WHERE ?',
		[{
			stock_quantity: newStockQty
		},
		{
      item_id: id
		}],
		function(err, res) {
			if (err) throw err;
			
			else {
				console.log(
				  '\nPurchase complete for Qty(' +
				  buyQty + ') of item_id ' + id + 
				  ' at a total cost of $' + cost + '.\n'
				);

				setTimeout(displayInventory, 5000);
			}
		}
	);
}