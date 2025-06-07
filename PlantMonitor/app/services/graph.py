import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

class GraphService:
    @staticmethod
    def create_time_series_plot(data):
        if not data:
            # 空のデータの場合、空のグラフを生成
            fig = go.Figure()
            fig.update_layout(
                title='データがありません',
                xaxis_title='日時',
                yaxis_title='平均値',
                template='plotly_white',
                autosize=True,
                annotations=[dict(
                    text='指定された期間にデータがありません',
                    xref='paper',
                    yref='paper',
                    x=0.5,
                    y=0.5,
                    showarrow=False
                )]
            )
            return fig.to_html(full_html=False, config={'responsive': True})
            
        df = pd.DataFrame(data)
        df['insert_date'] = pd.to_datetime(df['insert_date'])
        df = df.sort_values('insert_date')
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df['insert_date'],
            y=df['avg_value'],
            mode='lines+markers',
            name='平均値'
        ))
        
        fig.update_layout(
            title='時系列データ',
            xaxis_title='日時',
            yaxis_title='平均値',
            template='plotly_white',
            autosize=True
        )
        
        return fig.to_html(full_html=False, config={'responsive': True}) 