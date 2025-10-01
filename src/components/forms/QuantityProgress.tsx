interface QuantityProgressProps {
  quantity: number;
  completedQuantity: number;
  onQuantityChange: (quantity: number) => void;
  onCompletedQuantityChange: (completedQuantity: number) => void;
  readOnly?: boolean;
}

export default function QuantityProgress({
  quantity,
  completedQuantity,
  onQuantityChange,
  onCompletedQuantityChange,
  readOnly = false,
}: QuantityProgressProps) {
  const progress = quantity > 0 ? Math.round((completedQuantity / quantity) * 100) : 0;

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quantity & Progress</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Quantity Required */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700">
            Total Quantity Required
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={quantity}
            onChange={(e) => {
              const newQuantity = parseInt(e.target.value) || 1;
              onQuantityChange(newQuantity);
              // Auto-adjust completed quantity if it exceeds new total
              if (completedQuantity > newQuantity) {
                onCompletedQuantityChange(newQuantity);
              }
            }}
            readOnly={readOnly}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="1"
          />
          <p className="mt-1 text-xs text-gray-500">How many units need to be produced for this task</p>
        </div>

        {/* Completed Quantity */}
        <div>
          <label
            htmlFor="completed_quantity"
            className="block text-sm font-medium text-gray-700">
            Completed Quantity
          </label>
          <input
            type="number"
            id="completed_quantity"
            name="completed_quantity"
            min="0"
            max={quantity}
            value={completedQuantity}
            onChange={(e) => {
              const newCompleted = Math.min(parseInt(e.target.value) || 0, quantity);
              onCompletedQuantityChange(newCompleted);
            }}
            readOnly={readOnly}
            className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="0"
          />
          <p className="mt-1 text-xs text-gray-500">How many units have been completed</p>
        </div>

        {/* Progress */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Progress</label>
          <div className="mt-1 flex items-center">
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {completedQuantity}/{quantity}
            </span>
            <span className="ml-2 text-sm text-gray-500">{progress}%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Task completion progress</p>
        </div>
      </div>
    </div>
  );
}
