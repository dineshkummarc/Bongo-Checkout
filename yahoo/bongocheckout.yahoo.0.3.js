// Bongo Checkout Plugin for Yahoo! Small Business
// Bongo International, LLC
// ------------------------------------------------
// Written by Elijah Boston
// elijah.boston@bongous.com

// Version 0.3

var STORE_DOMAIN = 'store.yahoo.com';

// Add .startsWith function to String prototype
String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
}

String.prototype.stripHTML = function() {
	return this.replace(/(<([^>]+)>)/ig,'');
}

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,""); 
}

function getCustomerInfo() {
	var custInfo = new Array();
	
	custInfo['name'] = $('input[name="shippingAddressDS.shipping_ROW0_full_name"]').val();

	if (!custInfo['name']) {
		custInfo['name'] = $('input[name="shippingAddressDS.shipping_ROW0_first_name"]').val() + ' ' + $('input[name="shippingAddressDS.shipping_ROW0_last_name"]').val();
	}

	custInfo['fname'] = custInfo['name'].substring(0, custInfo['name'].indexOf(' '));
	custInfo['lname'] = custInfo['name'].substring(custInfo['name'].indexOf(' ') + 1, custInfo['name'].length);
	custInfo['addr1'] = $('input[name="shippingAddressDS.shipping_ROW0_address1"]').val();
	custInfo['addr2'] = $('input[name="shippingAddressDS.shipping_ROW0_address2"]').val();
	custInfo['zip'] = $('input[name="shippingAddressDS.shipping_ROW0_zip"]').val();
	custInfo['city'] = $('input[name="shippingAddressDS.shipping_ROW0_city"]').val();
	custInfo['state'] = $('input[name="shippingAddressDS.shipping_ROW0_state"]').val();
	custInfo['phone'] = $('input[name="shippingAddressDS.shipping_ROW0_phone"]').val();
	custInfo['country_2letteriso'] = $('select[name="shippingAddressDS.shipping_ROW0_country"]').val();
	custInfo['email'] = $('input[name="miscDS.shopperEmailAddress"]').val();
	
	//$('#ys_pageMessage').append('<p>Customer Info: </p>');
	//$('#ys_pageMessage').append('<p>name: '+ custInfo['name'] +'</p>');
	return custInfo;
}

function extractItemCode(some_url) {
	//console.log('extract: ', some_url.substr(some_url.lastIndexOf('/')+1, some_url.length).split('.')[0]);
	return some_url.substr(some_url.lastIndexOf('/')+1, some_url.length).split('.')[0];
}

function extractItemInfo(current_item) {
	var itemInfo = new Array();
	var name = $(current_item).attr('title');
	var price = $(current_item).parent().parent().parent().parent().children('.ys_unitPrice').html();
	var quant_parent = $(current_item).parent().parent().parent().parent().children('.ys_quantity');
	var quant = $(quant_parent).children('label').children('input').val();
	var custom = $(current_item).parent().parent().parent().parent().children('.ys_options').html();
	
	if (custom != null) { 
		custom = custom.replace('</li>',' -- ').stripHTML().trim(); 
	} else {
		custom = '';
	}
	
	//console.log('Custom: ', custom);

	itemInfo['name'] = name;
	itemInfo['code'] = extractItemCode($(current_item).attr('href'));
	itemInfo['quantity'] = quant;
	itemInfo['price'] = price.substring(1, price.length);
	itemInfo['custom'] = custom;
	return itemInfo;
}


function getCart() {
    var i=0;
    var cart = new Array();
    var itemInfo = '';
    var itemInfo_url = '';
	
	var coupon_el = '';
	var coupon_code = '';
	var coupon_name = '';
	var coupon_discount = '';
	var coupon_item = new Array();
	
	$('.ys_itemInfo a').each(function(index) {
		
		itemInfo_url = $(this).attr('href');

		if (itemInfo_url.startsWith('http://'+STORE_DOMAIN)) {
			itemInfo = extractItemInfo(this);
            cart[i] = itemInfo;
            i = i + 1;
		}
	});
	
    coupon_el = $('table.ys_basket tbody .ys_orderLine.ys_lastRow').prev();
	
	if (coupon_el.text().indexOf('savings:') > 0) {
		//console.log('Coupon: ', $('.ys_first', coupon_el).text().trim());
		//console.log('Coupon Discount: ',  -parseFloat( $('.ys_last', coupon_el).text().trim().substr(2)));
		
		
		coupon_discount = -parseFloat( $('.ys_last', coupon_el).text().trim().substr(2));
		coupon_name = $('.ys_first', coupon_el).text().trim();
		
		coupon_code = coupon_name.substr(0, coupon_name.indexOf('%'))+'-COUPON';
		
		//console.log('Coupon Code: ', coupon_code);
		
		coupon_item['name'] = coupon_name.substr(0, coupon_name.indexOf(':'));
		coupon_item['code'] = coupon_code;
		coupon_item['price'] = coupon_discount;
		coupon_item['quantity'] = 1;
		coupon_item['custom'] = coupon_code;
		cart[i] = coupon_item;
	}
	

	
    return cart;
}

function isMerchantSupportedCountry(country) {
	var supported_countries_str = $('input[name="MERCHANT_SUPPORTED_COUNTRIES"]').value;
	
	// If no supported countries found default to checking against US
	if (supported_countries_str == undefined) { 
		if (country == 'US') {
			return true;
		} else {
			return false;
		}
	}
	
	var supported_countries = supported_countries_str.split(',');
	
	// If merchant supported countries are set, check against them
	for (var i=0; i < supported_countries.length; i++) {
		if (supported_countries[i] == country) {
			return true;
		}
	}
	
	return false;
}

function showIntlCheckoutMessage() {
	$('#intlCheckoutMessage').show();
	$('#intlCheckoutMessage').css('display','block');
	$('#ys_shippingOptions').hide();
}

function hideIntlCheckoutMessage() {
	$('#intlCheckoutMessage').hide();
	$('#ys_shippingOptions').show();
}

function overrideIntlCheckout() {
		$('input[name="miscDS.useShippingAddress"]').removeAttr('disabled');
		$('input[name="ccPaymentDS.ccpayment_ROW0_ccHandle"]').removeAttr('disabled');
		$('select[name="ccPaymentDS.ccpayment_ROW0_expMonth"]').removeAttr('disabled');
		$('select[name="ccPaymentDS.ccpayment_ROW0_expYear"]').removeAttr('disabled');
		$('select[name="ccPaymentDS.ccpayment_ROW0_ccType"]').removeAttr('disabled');
		
		$('.ys_second input.ys_primary').removeAttr('disabled');
		$('.ys_second input.ys_primary').css('background','#DF6819');
		$('.ys_second input[name="intlCheckoutButton"]').hide();
}

function overrideDefaultCheckout() {
		$('input[name="miscDS.useShippingAddress"]').attr('disabled',true);
		$('input[name="ccPaymentDS.ccpayment_ROW0_ccHandle"]').attr('disabled',true);
		$('select[name="ccPaymentDS.ccpayment_ROW0_expMonth"]').attr('disabled',true);
		$('select[name="ccPaymentDS.ccpayment_ROW0_expYear"]').attr('disabled',true);
		$('select[name="ccPaymentDS.ccpayment_ROW0_ccType"]').attr('disabled',true);
		
		$('.ys_second input.ys_primary').attr('disabled',true);
		$('.ys_second input.ys_primary').css('background','#ADADAD');
		$('.ys_second input[name="intlCheckoutButton"]').show();
}

function submitInternationalOrder() {
	var items = getCart();
    var custInfo = getCustomerInfo();
	

	// PARTNER KEY
	var partner_key = 'YOUR_PARTNER_KEY';
	$('form[name="internationalForm"]').append('<input name="PARTNER_KEY" value="'+partner_key+'" type="hidden">');
	
	// Append customer info (Country / State / Zip)
	$('form[name="internationalForm"]').append('<input type="text" style="display:none;" name="CUST_FIRST_NAME" value="'+custInfo['fname']+'" />');
	$('form[name="internationalForm"]').append('<input type="text" style="display:none;" name="CUST_FIRST_NAME" value="'+custInfo['fname']+'" />');
	$('form[name="internationalForm"]').append('<input type="text" style="display:none;" name="CUST_LAST_NAME" value="'+custInfo['lname']+'" />');
	$('form[name="internationalForm"]').append('<input type="text" style="display:none;" name="CUST_ADDRESS_LINE_1" value="'+custInfo['addr1']+'" />');
	$('form[name="internationalForm"]').append('<input type="text" style="display:none;" name="CUST_ADDRESS_LINE_2" value="'+custInfo['addr2']+'" />');
	$('form[name="internationalForm"]').append('<input type="text" style="display:none;" name="CUST_PHONE" value="'+custInfo['phone']+'" />');
	$('form[name="internationalForm"]').append('<select style="display:none;" name="CUST_COUNTRY"><option value="'+custInfo['country_2letteriso']+'">'+custInfo['country']+'</option></select> ');
	$('form[name="internationalForm"]').append('<input style="display:none;" type="text" name="CUST_STATE" value="'+custInfo['state']+'" /> ');
	$('form[name="internationalForm"]').append('<input style="display:none;" type="text" name="CUST_CITY" value="'+custInfo['city']+'" /> ');
	$('form[name="internationalForm"]').append('<input style="display:none;" type="text" name="CUST_ZIP" value="'+custInfo['zip']+'" /> ');
	$('form[name="internationalForm"]').append('<input style="display:none;" type="text" name="CUST_EMAIL" value="'+custInfo['email']+'" /> ');
	
	//console.log('items: ', items);

	// Append info for each item (ID / Name / Price / Quantity)
	for (var i=0; i < items.length; i++) {
		$('form[name="internationalForm"]').append('<input type="hidden" name="PRODUCT_ID_'+(i+1)+'" value="'+items[i]['code']+'" /> ');
		$('form[name="internationalForm"]').append('<input type="hidden" name="PRODUCT_NAME_'+(i+1)+'" value="'+items[i]['name']+'" /> ');
		$('form[name="internationalForm"]').append('<input type="hidden" name="PRODUCT_PRICE_'+(i+1)+'" value="'+items[i]['price']+'" /> ');
		$('form[name="internationalForm"]').append('<input type="hidden" name="PRODUCT_Q_'+(i+1)+'" value="'+items[i]['quantity']+'" /> ');
		$('form[name="internationalForm"]').append('<input type="hidden" name="PRODUCT_SHIPPING_'+(i+1)+'" value="1.00"> ');
		$('form[name="internationalForm"]').append('<input type="hidden" name="PRODUCT_CUSTOM_1_'+(i+1)+'" value="'+items[i]['custom']+'"> ');

	}

	// Submit order info
	$('form[name="internationalForm"]').submit();
}

function init_intlCheckout() {

	// Prepare the form

	// Insert message, hidden
	$('#ys_shippingOptions').parent().append('<span id="intlCheckoutMessage"><b>International Customers</b>: Click "Continue to Bongo Checkout" to continue. You can choose your shipping options on the next page.</span>');
	$('#intlCheckoutMessage').css('padding','5px');
	$('#intlCheckoutMessage').css('margin','5px');
	$('#intlCheckoutMessage').css('border','1px solid #F26722');
	$('#intlCheckoutMessage').hide();
	
	// Insert checkout button, hidden
	$('.ys_second').append('<input type="button" name="intlCheckoutButton" value="Continue to Bongo Checkout">');
	$('.ys_second input[name="intlCheckoutButton"]').click( function() { submitInternationalOrder(); } );
	$('.ys_second input[name="intlCheckoutButton"]').css('background','#DF6819');
	$('.ys_second input[name="intlCheckoutButton"]').css('color','#fff');
	$('.ys_second input[name="intlCheckoutButton"]').css('font','bold 11px Arial,verdana,sans-serif');
	$('.ys_second input[name="intlCheckoutButton"]').hide();
}

$(document).ready(function() {
	init_intlCheckout();
	
	//
	var country = $('select[name="shippingAddressDS.shipping_ROW0_country"]').val();
	
	if (!isMerchantSupportedCountry(country)) {
	    showIntlCheckoutMessage();
        overrideDefaultCheckout();
	}
	
	// Attach change event to drop-down menu
	$('select[name="shippingAddressDS.shipping_ROW0_country"]').change(function() {
        if (isMerchantSupportedCountry(this.value)) {
            hideIntlCheckoutMessage();
            overrideIntlCheckout();
        } else {
            showIntlCheckoutMessage();
            overrideDefaultCheckout();
        }
	});
});