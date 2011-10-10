/**
 * Active Board for Mootools
 * @author Krzysztof Wilczek
 * @since 30.09.2011
 */
var Board = new Class({
	
	view: null,
	_boxes: [], // Empty array of boxes
	_palletes: [], // Empty array of boxes palletes
	
	Implements: [Options, Events],
	
	options: {
		board_width: 99, // Board width in grid size
		board_height: 90, // Board height in grid size
		grid_size: 10, // Size in px of grid simple part
		box_margin: 1, // Box margin in grid size
		save_path: null, // Path to save script
		
		default_pallete_id: null // Id of default boxes pallete
	},

	/**
	 * Object initialization, create new board 
	 * @param Object element
	 * @param Object options
	 */
	initialize: function(element, options)
	{
		if (!element)
		{
			return false;
		}
		this.view = $(element);
		if (!this.view)
		{
			return false;
		}
		
		this.setOptions(options);
		this._render();
		//this._renderPallete();
	},
	
	/**
	 * Render main active board for boxes
	 */
	_render: function()
	{
		this.view.setStyles({
			'width': this.options.board_width * this.options.grid_size,
			'height': this.options.board_height * this.options.grid_size
		});		
	},
	/**
	 * Check new box dimensions if they are correct and box can have new place and size
	 * @param Object dimensions
	 * @param Object Box
	 * @return Boolean
	 */
	checkBoxNewDimensions: function(box, dimensions)
	{	
		
		var self = this;
		if (!dimensions || !box)
		{
			return false;
		}
		
		// Box of left or top border
		if (dimensions.left < 0 || dimensions.top < 0) 
		{
			return false;
		}
		// Box out of right border
		if (dimensions.width + dimensions.left > self.options.board_width)
		{
			return false;
		}
		// Box out of bottom border
		if (dimensions.height + dimensions.top > self.options.board_height)
		{
			return false;
		}

		// Check all boxes (if someone is on the way then box cannot be resized or moved to selected position
		var box_on_way = false;
		this._boxes.each(function(item) {
			if (item != box && box.options.related_to_box != item.id)
			{

				if ((dimensions.left + dimensions.width + self.options.box_margin) > (item.options.dimensions.left ) 
					&& (dimensions.top + dimensions.height + self.options.box_margin) > (item.options.dimensions.top)
					&& (item.options.dimensions.top + item.options.dimensions.height + self.options.box_margin) > dimensions.top 
					&& (item.options.dimensions.left + item.options.dimensions.width + self.options.box_margin > dimensions.left)
				)
				{
					box_on_way = true;
				}
			}
		});
		console.log(box_on_way);
		
		return !box_on_way;
		
	},
	
	/**
	 * Correct selected box dimensions using dimensions_difference
	 * @param String box_id
	 * @param Object dimensions_difference
	 * @return Boolean
	 */
	correctBoxDimensions: function(box_id, dimensions_difference)
	{
		if (!box_id || !dimensions_difference)
		{
			return false;
		}
		var info = this.getBoxInfo(box_id);
		if (!info)
		{
			return false;
		}
		var box = info.box;
		
		var new_dimensions = {
			'left': box.options.dimensions.left - dimensions_difference.left + dimensions_difference.width,
			'top': box.options.dimensions.top - dimensions_difference.top + dimensions_difference.height,
			'width': box.options.dimensions.width - dimensions_difference.width,
			'height': box.options.dimensions.height - dimensions_difference.height
		};
		 
		box._setDimensions(new_dimensions);
		return true;
		
	},
	
	/**
	 * Move box to selected boxes pallete
	 * @param Object box
	 * @param Int pallete_id
	 * @return Boolean
	 */
	moveToPallete: function(box, pallete_id)
	{
		if (!pallete_id)
		{
			pallete_id = this.options.default_pallete_id;
		}
		pallete = this.getPalleteById(pallete_id);
		if (!pallete)
		{
			return false;
		}
		
		this.removeBox(box);
		pallete.addBox(box);
		return true;
	},
	
	/**
	 * Return pallete object by pallete_id
	 * @param Int pallete_id
	 * @return Object Pallete
	 */
	getPalleteById: function(pallete_id)
	{
		if (!pallete_id)
		{
			return null;
		}
		
		for (i=0; i<this._palletes.length; i++)
		{
			if (this._palletes[i].id == pallete_id)
			{
				return this._palletes[i];
			}
		}
	},
	
	/**
	 * Remove box from grid
	 */
	removeBox: function(box)
	{
		this._boxes.erase(box);
		box.view.dispose();
		
	},
	
	
	/**
	 * Get board box by box id, or retrun if box for selected id doesn't exsists
	 * @param int id
	 * @return Object Box 
	 */
	getBoxInfo: function(box_id)
	{
		if (!box_id)
		{
			return null;
		}
		for (i=0; i<this._boxes.length; i++)
		{
			if (this._boxes[i].id == box_id)
			{
				return {'box': this._boxes[i], 'index': i};
			}
		}
	},
	
	/**
	 * AJAX JSON save of actual board configuration
	 */
	save: function()
	{
		if (!this.options.save_path)
		{
			return false;
		}
		var board = this.copy();
		board.view.dispose();
		board.view = null;
		board.boxes.each(function(item) {
			item.destroy();
		})
		Request.JSON({
			url: this.options.save_path,
			data: JSON.encode(board),
			onComplete: function(response)
			{
				console.log(response);
			}
		}).send();
	},
	
	/**
	 * Add new box to the board
	 * @param String box_id
	 * @param Object options
	 * @return Object Box 
	 */
	newBox: function(box_id, options)
	{
		var box = new Box(box_id, this, options);
		this._boxes.push(box);
		this.view.grab(box.view);
		return box;
	},
	
	/**
	 * Add new pallete to the board
	 * @param String pallete_id
	 * @param Object options
	 * @return Object Pallete
	 */
	newPallete: function(pallete_id, options)
	{
		var pallete = new Pallete(pallete_id, this, options);
		this._palletes.push(pallete);
		if (this._palletes.length == 1)
		{
			this.options.default_pallete_id = pallete_id;
		}
		return pallete;
	}
	
	
});
	